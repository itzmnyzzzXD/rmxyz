/** Dashboard server functions for local verified accounts and legacy Discord OAuth sessions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRMSession } from "@/lib/session.server";
import { avatarUrl, botOwnerIds, canManageGuild, fetchBotGuild, fetchBotGuildChannels, fetchUserGuilds, guildIconUrl, isDiscordConfigured, refreshAccessToken } from "@/lib/discord.server";
import { DEFAULTS } from "@/lib/rm/modules";
import { queueTask, store, upsertGuild, type JsonValue } from "@/lib/rm/store.server";
import { getLocalUserFromSession } from "@/lib/local-auth.server";

export type SessionUser = { id: string; name: string; avatar: string; isOwner: boolean } | null;
export type ManageableGuild = { id: string; name: string; icon: string | null; botPresent: boolean; memberCount: number };

type AuthContext = {
  userId: string;
  accessToken?: string;
  local: boolean;
  managedGuildIds: string[];
  data: Awaited<ReturnType<typeof getRMSession>>["data"];
};

async function requireUser(): Promise<AuthContext> {
  const session = await getRMSession();
  const data = session.data;
  if (!data.userId) throw new Error("NOT_SIGNED_IN");

  if (data.authProvider === "local") {
    const user = await getLocalUserFromSession();
    if (!user || user.id !== data.userId) throw new Error("NOT_SIGNED_IN");
    return { userId: user.id, local: true, managedGuildIds: user.managedGuildIds, data };
  }

  let { accessToken, refreshToken } = data;
  if (!accessToken) throw new Error("NOT_SIGNED_IN");
  const expiresSoon = !data.expiresAt || data.expiresAt <= Date.now() + 60_000;
  if (expiresSoon && refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
      await session.update({ accessToken, refreshToken: refreshed.refresh_token ?? refreshToken, expiresAt: Date.now() + refreshed.expires_in * 1000 });
    } catch {
      throw new Error("DISCORD_SESSION_EXPIRED");
    }
  }
  return { userId: data.userId, accessToken, local: false, managedGuildIds: data.managedGuildIds ?? [], data: session.data };
}

async function requireGuildAccess(guildId: string) {
  const auth = await requireUser();
  if (botOwnerIds().includes(auth.userId)) return { userId: auth.userId };
  if (auth.local) {
    if (!auth.managedGuildIds.includes(guildId)) throw new Error("NO_ACCESS");
    return { userId: auth.userId };
  }
  const guilds = await fetchUserGuilds(auth.accessToken!);
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild || !canManageGuild(guild)) throw new Error("NO_ACCESS");
  return { userId: auth.userId };
}

function sessionAvatar(id: string, avatar?: string | null) {
  if (avatar?.startsWith("http://") || avatar?.startsWith("https://")) return avatar;
  return avatarUrl(id, avatar ?? null);
}

export const getSessionUser = createServerFn({ method: "GET" }).handler(async (): Promise<SessionUser> => {
  const session = await getRMSession();
  const { userId, username, globalName, avatar } = session.data;
  if (!userId) return null;
  return { id: userId, name: globalName || username || "RM user", avatar: sessionAvatar(userId, avatar), isOwner: botOwnerIds().includes(session.data.discordId ?? userId) };
});

export const getAuthState = createServerFn({ method: "GET" }).handler(async () => ({ configured: true }));

export const listManageableGuilds = createServerFn({ method: "GET" }).handler(async (): Promise<ManageableGuild[]> => {
  const auth = await requireUser();
  let guilds: { id: string; name: string; icon: string | null }[];
  if (auth.local) {
    guilds = auth.managedGuildIds.map((id) => ({ id, name: `Server ${id}`, icon: null }));
  } else {
    guilds = (await fetchUserGuilds(auth.accessToken!)).filter(canManageGuild).map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
  }
  const rows = await Promise.all(guilds.map(async (g) => {
    const known = store.guilds.get(g.id);
    const botGuild = await fetchBotGuild(g.id);
    return {
      id: g.id,
      name: botGuild?.name ?? g.name,
      icon: botGuild ? guildIconUrl(botGuild.id, botGuild.icon) : guildIconUrl(g.id, g.icon),
      botPresent: Boolean(botGuild || known?.botPresent),
      memberCount: botGuild?.approximate_member_count ?? known?.memberCount ?? 0,
    };
  }));
  return rows.sort((a, b) => Number(b.botPresent) - Number(a.botPresent) || a.name.localeCompare(b.name));
});

const guildInput = (input: { guildId: string }) => z.object({ guildId: z.string().min(5) }).parse(input);

export const getGuildOverview = createServerFn({ method: "POST" }).inputValidator(guildInput).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  const known = store.guilds.get(data.guildId);
  const live = await fetchBotGuild(data.guildId);
  const guild = live || known;
  const cases = store.cases.filter((x) => x.guild_id === data.guildId).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8);
  const security = store.security.filter((x) => x.guild_id === data.guildId).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 6);
  const stats = store.stats.filter((x) => x.guild_id === data.guildId).sort((a, b) => String(a.day).localeCompare(String(b.day))).slice(-14);
  const counts = new Map<string, number>();
  for (const row of store.usage.filter((x) => x.guildId === data.guildId).slice(-200)) counts.set(row.command, (counts.get(row.command) ?? 0) + 1);
  return {
    guild: guild ? {
      id: guild.id,
      name: guild.name,
      icon: live ? guildIconUrl(live.id, live.icon) : guildIconUrl(known!.id, known!.icon),
      memberCount: live?.approximate_member_count ?? ("memberCount" in guild ? guild.memberCount : 0),
      channelCount: "channelCount" in guild ? guild.channelCount : 0,
      roleCount: "roleCount" in guild ? guild.roleCount : live?.roles.length ?? 0,
      botPresent: Boolean(live || known?.botPresent),
      lastSeenAt: known?.lastSeenAt ?? null,
    } : null,
    cases, security, stats,
    topCommands: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([command, count]) => ({ command, count })),
  };
});

export const getGuildConfig = createServerFn({ method: "POST" }).inputValidator(guildInput).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  const config: Record<string, { enabled: boolean; settings: Record<string, JsonValue> }> = {};
  for (const key of Object.keys(DEFAULTS)) {
    const row = store.configs.get(`${data.guildId}:${key}`);
    config[key] = { enabled: row?.enabled ?? false, settings: row?.settings ?? {} };
  }
  const words = [...store.words.values()].filter((x) => x.guildId === data.guildId);
  const channels = await fetchBotGuildChannels(data.guildId);
  return { config, words, channels: channels.filter((c) => c.type === 0 || c.type === 5).map((c) => ({ id: c.id, name: c.name })) };
});

export const saveGuildConfig = createServerFn({ method: "POST" }).inputValidator((input: { guildId: string; module: string; enabled: boolean; settings: Record<string, JsonValue> }) => z.object({ guildId: z.string().min(5), module: z.string().min(2), enabled: z.boolean(), settings: z.record(z.string(), z.custom<JsonValue>()) }).parse(input)).handler(async ({ data }) => {
  const { userId } = await requireGuildAccess(data.guildId);
  if (!(data.module in DEFAULTS)) throw new Error("Unknown module");
  upsertGuild({ id: data.guildId });
  store.configs.set(`${data.guildId}:${data.module}`, { enabled: data.enabled, settings: data.settings });
  queueTask({ guildId: data.guildId, taskType: "reload_config", payload: { module: data.module, enabled: data.enabled, settings: data.settings }, requestedBy: userId });
  return { ok: true };
});

export const listCases = createServerFn({ method: "POST" }).inputValidator((input: { guildId: string; search?: string }) => z.object({ guildId: z.string().min(5), search: z.string().optional() }).parse(input)).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  const search = data.search?.toLowerCase();
  return store.cases.filter((x) => x.guild_id === data.guildId && (!search || String(x.target_tag ?? "").toLowerCase().includes(search))).sort((a, b) => Number(b.case_number ?? 0) - Number(a.case_number ?? 0)).slice(0, 100);
});

export const listLogs = createServerFn({ method: "POST" }).inputValidator(guildInput).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  return store.logs.filter((x) => x.guild_id === data.guildId).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 100);
});

export const getSecurityCenter = createServerFn({ method: "POST" }).inputValidator(guildInput).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  return { events: store.security.filter((x) => x.guild_id === data.guildId).slice(-50).reverse(), lockdown: null, trusted: [] };
});

export const queueBotTask = createServerFn({ method: "POST" }).inputValidator((input: { guildId: string; taskType: string; payload?: Record<string, JsonValue> }) => z.object({ guildId: z.string().min(5), taskType: z.enum(["lockdown", "unlockdown", "raidmode_on", "raidmode_off", "reload_config", "announce", "sync_slash"]), payload: z.record(z.string(), z.custom<JsonValue>()).optional() }).parse(input)).handler(async ({ data }) => {
  const { userId } = await requireGuildAccess(data.guildId);
  queueTask({ guildId: data.guildId, taskType: data.taskType, payload: data.payload ?? {}, requestedBy: userId });
  return { ok: true };
});

export const addFilterWord = createServerFn({ method: "POST" }).inputValidator((input: { guildId: string; word: string }) => z.object({ guildId: z.string().min(5), word: z.string().min(1).max(64) }).parse(input)).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  const id = crypto.randomUUID();
  store.words.set(id, { id, guildId: data.guildId, word: data.word.toLowerCase(), listType: "blocked", matchMode: "partial" });
  return { ok: true };
});

export const removeFilterWord = createServerFn({ method: "POST" }).inputValidator((input: { guildId: string; id: string }) => z.object({ guildId: z.string().min(5), id: z.string().min(1) }).parse(input)).handler(async ({ data }) => {
  await requireGuildAccess(data.guildId);
  const word = store.words.get(data.id);
  if (word?.guildId === data.guildId) store.words.delete(data.id);
  return { ok: true };
});

export const getOwnerPanel = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await requireUser();
  if (!botOwnerIds().includes(userId)) throw new Error("NO_ACCESS");
  const counts = new Map<string, number>();
  for (const row of store.usage) counts.set(row.command, (counts.get(row.command) ?? 0) + 1);
  return {
    shards: store.status,
    guilds: [...store.guilds.values()].sort((a, b) => b.memberCount - a.memberCount).slice(0, 50),
    errors: store.errors.slice(-25).reverse(),
    blacklist: store.blacklist.slice(-50).reverse(),
    topCommands: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([command, count]) => ({ command, count })),
  };
});
