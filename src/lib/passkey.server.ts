import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse, type WebAuthnCredential } from "@simplewebauthn/server";
import { getRMSession } from "@/lib/session.server";
import { getLocalUserById, signInLocal, type LocalUser } from "@/lib/local-auth.server";

const RP_ID = "rmxyz.vercel.app";
const ORIGIN = "https://rmxyz.vercel.app";
const RP_NAME = "RM Dashboard";
const STORE_KEY = "rm:passkeys:v1";

type PasskeyStore = { credentials: Record<string, PasskeyRecord>; registrationChallenges: Record<string, { userId: string; challenge: string; expiresAt: number }>; authenticationChallenges: Record<string, { challenge: string; expiresAt: number }> };
export type PasskeyRecord = { id: string; userId: string; publicKey: number[]; counter: number; transports?: string[]; deviceType?: string; backedUp?: boolean; createdAt: string; name: string };
const memory = globalThis as typeof globalThis & { __rmPasskeys?: PasskeyStore };
if (!memory.__rmPasskeys) memory.__rmPasskeys = { credentials: {}, registrationChallenges: {}, authenticationChallenges: {} };
const redisUrl = () => process.env["UPSTASH_REDIS_REST_URL"]?.replace(/\/$/, "") || "";
const redisToken = () => process.env["UPSTASH_REDIS_REST_TOKEN"] || "";

async function redis<T>(command: string, key: string, value?: string): Promise<T | null> {
  const url = redisUrl(); const token = redisToken(); if (!url || !token) return null;
  const path = value === undefined ? `${url}/${command}/${encodeURIComponent(key)}` : `${url}/${command}/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
  const res = await fetch(path, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Redis ${command} failed (${res.status})`);
  const body = await res.json() as { result?: T }; return body.result ?? null;
}

async function loadStore() {
  if (!redisUrl() || !redisToken()) return memory.__rmPasskeys!;
  const raw = await redis<string>("get", STORE_KEY);
  const store: PasskeyStore = raw ? JSON.parse(raw) : { credentials: {}, registrationChallenges: {}, authenticationChallenges: {} };
  memory.__rmPasskeys = store; return store;
}
async function saveStore(store: PasskeyStore) { memory.__rmPasskeys = store; if (redisUrl() && redisToken()) await redis<string>("set", STORE_KEY, JSON.stringify(store)); }
function prune(store: PasskeyStore) { const t = Date.now(); for (const [k,v] of Object.entries(store.registrationChallenges)) if (v.expiresAt < t) delete store.registrationChallenges[k]; for (const [k,v] of Object.entries(store.authenticationChallenges)) if (v.expiresAt < t) delete store.authenticationChallenges[k]; }
async function currentUser(): Promise<LocalUser | null> { const session = await getRMSession(); if (session.data.authProvider !== "local" || !session.data.userId) return null; return getLocalUserById(session.data.userId); }

export async function getRegistrationOptions() {
  const store = await loadStore(); prune(store); const user = await currentUser(); if (!user) throw new Error("NOT_SIGNED_IN");
  const existing = Object.values(store.credentials).filter((x) => x.userId === user.id);
  const options = await generateRegistrationOptions({ rpName: RP_NAME, rpID: RP_ID, userName: user.username, userID: new TextEncoder().encode(user.id), attestationType: "none", excludeCredentials: existing.map((x) => ({ id: x.id, transports: x.transports as never })), authenticatorSelection: { residentKey: "required", userVerification: "required", authenticatorAttachment: "platform" }, supportedAlgorithmIDs: [-7, -257] });
  store.registrationChallenges[user.id] = { userId: user.id, challenge: options.challenge, expiresAt: Date.now() + 5 * 60_000 }; await saveStore(store); return options;
}

export async function verifyPasskeyRegistration(response: unknown, name = "This device") {
  const store = await loadStore(); prune(store); const user = await currentUser(); if (!user) throw new Error("NOT_SIGNED_IN");
  const pending = store.registrationChallenges[user.id]; if (!pending || pending.expiresAt < Date.now()) throw new Error("REGISTRATION_EXPIRED");
  const verification = await verifyRegistrationResponse({ response: response as Parameters<typeof verifyRegistrationResponse>[0]["response"], expectedChallenge: pending.challenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID, requireUserVerification: true, supportedAlgorithmIDs: [-7, -257] });
  if (!verification.verified || !verification.registrationInfo) throw new Error("PASSKEY_REJECTED");
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  store.credentials[credential.id] = { id: credential.id, userId: user.id, publicKey: Array.from(credential.publicKey), counter: credential.counter, transports: credential.transports, deviceType: credentialDeviceType, backedUp: credentialBackedUp, createdAt: new Date().toISOString(), name: name.trim().slice(0, 60) || "This device" };
  delete store.registrationChallenges[user.id]; await saveStore(store); return { verified: true };
}

export async function getAuthenticationOptions() {
  const store = await loadStore(); prune(store);
  const options = await generateAuthenticationOptions({ rpID: RP_ID, userVerification: "required", allowCredentials: Object.values(store.credentials).map((x) => ({ id: x.id, transports: x.transports as never })) });
  const id = crypto.randomUUID(); store.authenticationChallenges[id] = { challenge: options.challenge, expiresAt: Date.now() + 5 * 60_000 }; await saveStore(store); return { ...options, challengeId: id };
}

export async function verifyPasskeyAuthentication(response: unknown, challengeId: string) {
  const store = await loadStore(); prune(store); const pending = store.authenticationChallenges[challengeId]; if (!pending || pending.expiresAt < Date.now()) throw new Error("AUTHENTICATION_EXPIRED");
  const credentialId = (response as { id?: string }).id; const credential = credentialId ? store.credentials[credentialId] : undefined; if (!credential) throw new Error("PASSKEY_NOT_FOUND");
  const verification = await verifyAuthenticationResponse({ response: response as Parameters<typeof verifyAuthenticationResponse>[0]["response"], expectedChallenge: pending.challenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID, requireUserVerification: true, credential: { id: credential.id, publicKey: new Uint8Array(credential.publicKey), counter: credential.counter, transports: credential.transports as never } satisfies WebAuthnCredential });
  if (!verification.verified) throw new Error("PASSKEY_REJECTED"); credential.counter = verification.authenticationInfo.newCounter; delete store.authenticationChallenges[challengeId]; await saveStore(store);
  const user = await getLocalUserById(credential.userId); if (!user) throw new Error("ACCOUNT_NOT_FOUND"); await signInLocal(user); return { verified: true, userId: user.id };
}
