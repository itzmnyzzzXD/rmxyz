import { getRMSession } from "@/lib/session.server";

const USERS_KEY = "rm:accounts:v1";
const CHALLENGES_KEY = "rm:verify:challenges:v1";
const PENDING_KEY = "rm:verify:pending:v1";
const redisUrl = () => process.env["UPSTASH_REDIS_REST_URL"]?.replace(/\/$/, "") || "";
const redisToken = () => process.env["UPSTASH_REDIS_REST_TOKEN"] || "";
const memory = globalThis as typeof globalThis & { __rmLocalAuth?: { users: Record<string, LocalUser>; challenges: Record<string, VerifyChallenge>; pending: Record<string, PendingSignup> } };
if (!memory.__rmLocalAuth) memory.__rmLocalAuth = { users: {}, challenges: {}, pending: {} };

export type LocalUser = { id: string; discordId: string; email: string; username: string; avatar?: string; passwordHash: string; passwordSalt: string; createdAt: string; managedGuildIds: string[] };
type VerifyChallenge = { discordId: string; discordUsername: string; guildId: string; expiresAt: number };
type PendingSignup = { id: string; challengeId: string; discordId: string; guildId: string; email: string; username: string; avatar?: string; passwordHash: string; passwordSalt: string; verifyTokenHash: string; expiresAt: number };
type Store = { users: Record<string, LocalUser>; challenges: Record<string, VerifyChallenge>; pending: Record<string, PendingSignup> };

async function redis<T>(command: string, key: string, value?: string): Promise<T | null> {
  const url = redisUrl(); const token = redisToken(); if (!url || !token) return null;
  const path = value === undefined ? `${url}/${command}/${encodeURIComponent(key)}` : `${url}/${command}/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
  const res = await fetch(path, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Redis ${command} failed (${res.status})`);
  const body = await res.json() as { result?: T }; return body.result ?? null;
}
async function getStore(): Promise<Store> {
  if (!redisUrl() || !redisToken()) return memory.__rmLocalAuth!;
  const [raw, rawChallenges, rawPending] = await Promise.all([redis<string>("get", USERS_KEY), redis<string>("get", CHALLENGES_KEY), redis<string>("get", PENDING_KEY)]);
  return { users: raw ? JSON.parse(raw) : {}, challenges: rawChallenges ? JSON.parse(rawChallenges) : {}, pending: rawPending ? JSON.parse(rawPending) : {} };
}
async function saveStore(store: Store) {
  memory.__rmLocalAuth = store;
  if (!redisUrl() || !redisToken()) return;
  await Promise.all([redis<string>("set", USERS_KEY, JSON.stringify(store.users)), redis<string>("set", CHALLENGES_KEY, JSON.stringify(store.challenges)), redis<string>("set", PENDING_KEY, JSON.stringify(store.pending))]);
}
function bytesToBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (c) => c.charCodeAt(0)); }
function randomToken(bytes = 32) { const out = new Uint8Array(bytes); crypto.getRandomValues(out); return bytesToBase64(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function sha256(value: string) { return bytesToBase64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))); }
export async function hashPassword(password: string) { const salt = new Uint8Array(16); crypto.getRandomValues(salt); const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256); return { salt: bytesToBase64(salt), hash: bytesToBase64(new Uint8Array(bits)) }; }
export async function verifyPassword(password: string, salt: string, expected: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: base64ToBytes(salt), iterations: 120000, hash: "SHA-256" }, key, 256); const actual = new Uint8Array(bits); const wanted = base64ToBytes(expected); if (actual.length !== wanted.length) return false; let diff = 0; for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ wanted[i]; return diff === 0; }
function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function purge(store: Store) { const now = Date.now(); for (const [id, value] of Object.entries(store.challenges)) if (value.expiresAt <= now) delete store.challenges[id]; for (const [id, value] of Object.entries(store.pending)) if (value.expiresAt <= now) delete store.pending[id]; }
export async function createVerifyChallenge(input: { discordId: string; discordUsername: string; guildId: string }) { const store = await getStore(); purge(store); const id = randomToken(24); store.challenges[id] = { ...input, expiresAt: Date.now() + 15 * 60_000 }; await saveStore(store); return id; }
export async function getVerifyChallenge(id: string) { const store = await getStore(); purge(store); const challenge = store.challenges[id]; return challenge ? { id, ...challenge } : null; }
export async function requestSignup(input: { challengeId: string; email: string; username: string; avatar?: string; password: string }) { const store = await getStore(); purge(store); const challenge = store.challenges[input.challengeId]; if (!challenge) throw new Error("VERIFY_LINK_EXPIRED"); const email = normalizeEmail(input.email); const username = input.username.trim().replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 24); if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("INVALID_EMAIL"); if (username.length < 3) throw new Error("INVALID_USERNAME"); if (input.password.length < 8) throw new Error("WEAK_PASSWORD"); const byEmail = Object.values(store.users).find((u) => u.email === email); if (byEmail && byEmail.discordId !== challenge.discordId) throw new Error("EMAIL_IN_USE"); if (Object.values(store.users).some((u) => u.username.toLowerCase() === username.toLowerCase() && u.discordId !== challenge.discordId)) throw new Error("USERNAME_IN_USE"); const { salt, hash } = await hashPassword(input.password); const verifyToken = randomToken(32); const pending: PendingSignup = { id: randomToken(16), challengeId: input.challengeId, discordId: challenge.discordId, guildId: challenge.guildId, email, username, avatar: input.avatar?.trim().slice(0, 500), passwordHash: hash, passwordSalt: salt, verifyTokenHash: await sha256(verifyToken), expiresAt: Date.now() + 30 * 60_000 }; store.pending[pending.id] = pending; await saveStore(store); return { email, verifyToken }; }
export async function confirmSignup(token: string) { const store = await getStore(); purge(store); const hash = await sha256(token); const pendingEntry = Object.entries(store.pending).find(([, value]) => value.verifyTokenHash === hash); if (!pendingEntry) throw new Error("VERIFY_EMAIL_EXPIRED"); const [, pending] = pendingEntry; let user = Object.values(store.users).find((u) => u.discordId === pending.discordId); if (user) { user.email = pending.email; user.username = pending.username; user.avatar = pending.avatar; user.passwordHash = pending.passwordHash; user.passwordSalt = pending.passwordSalt; if (!user.managedGuildIds.includes(pending.guildId)) user.managedGuildIds.push(pending.guildId); } else { user = { id: randomToken(20), discordId: pending.discordId, email: pending.email, username: pending.username, avatar: pending.avatar, passwordHash: pending.passwordHash, passwordSalt: pending.passwordSalt, createdAt: new Date().toISOString(), managedGuildIds: [pending.guildId] }; store.users[user.id] = user; } delete store.pending[pending.id]; delete store.challenges[pending.challengeId]; await saveStore(store); return user; }
export async function loginLocal(email: string, password: string) { const store = await getStore(); purge(store); const user = Object.values(store.users).find((u) => u.email === normalizeEmail(email)); if (!user || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) return null; return user; }
export async function getLocalUserById(id: string) { const store = await getStore(); purge(store); return store.users[id] ?? null; }
export async function signInLocal(user: LocalUser) { const session = await getRMSession(); await session.update({ userId: user.id, username: user.username, globalName: user.username, avatar: user.avatar, discordId: user.discordId, accessToken: undefined, refreshToken: undefined, expiresAt: undefined, managedGuildIds: user.managedGuildIds, authProvider: "local" }); }
export async function getLocalUserFromSession() { const session = await getRMSession(); if (session.data.authProvider !== "local" || !session.data.userId) return null; return getLocalUserById(session.data.userId); }
