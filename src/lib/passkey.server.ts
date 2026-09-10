import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type WebAuthnCredential,
} from "@simplewebauthn/server";
import { getRMSession } from "@/lib/session.server";
import { signInLocal } from "@/lib/local-auth.server";

const RP_ID = "rmxyz.vercel.app";
const ORIGIN = "https://rmxyz.vercel.app";
const RP_NAME = "RM Dashboard";

const memory = globalThis as typeof globalThis & {
  __rmPasskeys?: {
    credentials: Record<string, PasskeyRecord>;
    registrationChallenges: Record<string, { userId: string; challenge: string; expiresAt: number }>;
    authenticationChallenges: Record<string, { challenge: string; expiresAt: number }>;
  };
};

if (!memory.__rmPasskeys) {
  memory.__rmPasskeys = { credentials: {}, registrationChallenges: {}, authenticationChallenges: {} };
}

export type PasskeyRecord = {
  id: string;
  userId: string;
  publicKey: number[];
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
  createdAt: string;
  name: string;
};

function now() {
  return Date.now();
}

function b64urlBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function prune() {
  for (const [key, value] of Object.entries(memory.__rmPasskeys!.registrationChallenges)) {
    if (value.expiresAt < now()) delete memory.__rmPasskeys!.registrationChallenges[key];
  }
  for (const [key, value] of Object.entries(memory.__rmPasskeys!.authenticationChallenges)) {
    if (value.expiresAt < now()) delete memory.__rmPasskeys!.authenticationChallenges[key];
  }
}

export async function getCurrentLocalUser() {
  const session = await getRMSession();
  if ((session.data as typeof session.data & { authProvider?: string }).authProvider !== "local") return null;
  const userId = session.data.userId;
  if (!userId) return null;
  const { getLocalUserById } = await import("@/lib/local-auth.server");
  return getLocalUserById(userId);
}

export async function getRegistrationOptions() {
  prune();
  const user = await getCurrentLocalUser();
  if (!user) throw new Error("NOT_SIGNED_IN");

  const existing = Object.values(memory.__rmPasskeys!.credentials).filter((key) => key.userId === user.id);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.username,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((key) => ({
      id: key.id,
      transports: key.transports as never,
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
    supportedAlgorithmIDs: [-7, -257],
  });
  memory.__rmPasskeys!.registrationChallenges[user.id] = {
    userId: user.id,
    challenge: options.challenge,
    expiresAt: now() + 5 * 60_000,
  };
  return options;
}

export async function verifyPasskeyRegistration(response: unknown, name = "This device") {
  prune();
  const user = await getCurrentLocalUser();
  if (!user) throw new Error("NOT_SIGNED_IN");
  const pending = memory.__rmPasskeys!.registrationChallenges[user.id];
  if (!pending || pending.expiresAt < now()) throw new Error("REGISTRATION_EXPIRED");

  const verification = await verifyRegistrationResponse({
    response: response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
    expectedChallenge: pending.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
    supportedAlgorithmIDs: [-7, -257],
  });
  if (!verification.verified || !verification.registrationInfo) throw new Error("PASSKEY_REJECTED");

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  memory.__rmPasskeys!.credentials[credential.id] = {
    id: credential.id,
    userId: user.id,
    publicKey: Array.from(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    createdAt: new Date().toISOString(),
    name: name.trim().slice(0, 60) || "This device",
  };
  delete memory.__rmPasskeys!.registrationChallenges[user.id];
  return { verified: true };
}

export async function getAuthenticationOptions() {
  prune();
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "required",
    allowCredentials: Object.values(memory.__rmPasskeys!.credentials).map((key) => ({
      id: key.id,
      transports: key.transports as never,
    })),
  });
  const id = crypto.randomUUID();
  memory.__rmPasskeys!.authenticationChallenges[id] = {
    challenge: options.challenge,
    expiresAt: now() + 5 * 60_000,
  };
  return { ...options, challengeId: id };
}

export async function verifyPasskeyAuthentication(response: unknown, challengeId: string) {
  prune();
  const pending = memory.__rmPasskeys!.authenticationChallenges[challengeId];
  if (!pending || pending.expiresAt < now()) throw new Error("AUTHENTICATION_EXPIRED");

  const responseBody = response as { id?: string };
  const credential = responseBody?.id ? memory.__rmPasskeys!.credentials[responseBody.id] : undefined;
  if (!credential) throw new Error("PASSKEY_NOT_FOUND");

  const verification = await verifyAuthenticationResponse({
    response: response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
    expectedChallenge: pending.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
    credential: {
      id: credential.id,
      publicKey: new Uint8Array(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports as never,
    } satisfies WebAuthnCredential,
  });

  if (!verification.verified) throw new Error("PASSKEY_REJECTED");
  credential.counter = verification.authenticationInfo.newCounter;
  delete memory.__rmPasskeys!.authenticationChallenges[challengeId];

  const { getLocalUserById } = await import("@/lib/local-auth.server");
  const user = await getLocalUserById(credential.userId);
  if (!user) throw new Error("ACCOUNT_NOT_FOUND");
  await signInLocal(user);
  return { verified: true, userId: user.id };
}
