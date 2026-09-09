/**
 * Dashboard server functions.
 * Every function authenticates through the encrypted `rm_session` cookie and
 * re-checks Discord "Manage Server" permission for the requested guild.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getRMSession } from "@/lib/session.server";
import {
  avatarUrl,
  botOwnerIds,
  canManageGuild,
  fetchBotGuildChannels,
  fetchUserGuilds,
  guildIconUrl,
  isDiscordConfigured,
} from "@/lib/discord.server";
import { DEFAULTS, type ModuleKey } from "@/lib/rm/modules";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SessionUser = {
  id: string;
  name: string;
  avatar: string;
  isOwner: boolean;
} | null;

export type ManageableGuild = {
  id: string;
  name: string;
  icon: string | null;
  botPresent: boolean;
  memberCount: number;
};

async function requireUser() {
  const session = await getRMSession();
  const { userId, accessToken } = session.data;
  if (!userId || !accessToken) throw new Error("NOT_SIGNED_IN");
  return { userId, accessToken, data: session.data };
}

async function requireGuildAccess(guildId: string) {
  const { userId, accessToken } = await requireUser();
  if (botOwnerIds().includes(userId)) return { userId };
  const guilds = await fetchUserGuilds(accessToken);
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild || !canManageGuild(guild)) throw new Error("NO_ACCESS");
  return { userId };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getSessionUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser> => {
    const session = await getRMSession();
    const { userId, username, globalName, avatar } = session.data;
    if (!userId) return null;
    return {
      id: userId,
      name: globalName || username || "Discord user",
      avatar: avatarUrl(userId, avatar ?? null),
      isOwner: botOwnerIds().includes(userId),
    };
  },
);

export const getAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ configured: boolean }> => ({
    configured: isDiscordConfigured(),
  }),
);

export const listManageableGuilds = createServerFn({ method: "GET" }).handler(
  async (): Promise<ManageableGuild[]> => {
    const { accessToken } = await requireUser();
    const guilds = (await fetchUserGuilds(accessToken)).filter(canManageGuild);
    const db = await admin();
    const { data: known } = await db
      .from("guilds")
      .select("id, member_count, bot_present")
      .in("id", guilds.length ? guilds.map((g) => g.id) : ["0"]);
    const map = new Map((known ?? []).map((g) => [g.id, g]));
    return guilds
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: guildIconUrl(g.id, g.icon),
        botPresent: Boolean(map.get(g.id)?.bot_present),
        memberCount: map.get(g.id)?.member_count ?? 0,
      }))
      .sort((a, b) => Number(b.botPresent) - Number(a.botPresent) || a.name.localeCompare(b.name));
  },
);

const guildInput = (input: { guildId: string }) =>
  z.object({ guildId: z.string().min(5) }).parse(input);

export const getGuildOverview = createServerFn({ method: "POST" })
  .inputValidator(guildInput)
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    const [guild, cases, security, stats, usage] = await Promise.all([
      db.from("guilds").select("*").eq("id", data.guildId).maybeSingle(),
      db
        .from("mod_cases")
        .select("case_number, action, target_tag, moderator_tag, reason, created_at")
        .eq("guild_id", data.guildId)
        .order("created_at", { ascending: false })
        .limit(8),
      db
        .from("security_events")
        .select("system, event_type, severity, actor_tag, action_taken, created_at")
        .eq("guild_id", data.guildId)
        .order("created_at", { ascending: false })
        .limit(6),
      db
        .from("guild_stats_daily")
        .select("*")
        .eq("guild_id", data.guildId)
        .order("day", { ascending: false })
        .limit(14),
      db
        .from("command_usage")
        .select("command")
        .eq("guild_id", data.guildId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const counts = new Map<string, number>();
    for (const row of usage.data ?? [])
      counts.set(row.command, (counts.get(row.command) ?? 0) + 1);

    return {
      guild: guild.data
        ? {
            id: guild.data.id,
            name: guild.data.name,
            icon: guildIconUrl(guild.data.id, guild.data.icon),
            memberCount: guild.data.member_count,
            channelCount: guild.data.channel_count,
            roleCount: guild.data.role_count,
            botPresent: guild.data.bot_present,
            lastSeenAt: guild.data.last_seen_at,
          }
        : null,
      cases: cases.data ?? [],
      security: security.data ?? [],
      stats: (stats.data ?? []).slice().reverse(),
      topCommands: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([command, count]) => ({ command, count })),
    };
  });

export const getGuildConfig = createServerFn({ method: "POST" })
  .inputValidator(guildInput)
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    const [{ data: rows }, { data: words }] = await Promise.all([
      db
        .from("guild_configs")
        .select("module, enabled, settings")
        .eq("guild_id", data.guildId),
      db
        .from("filter_words")
        .select("id, word, list_type, match_mode")
        .eq("guild_id", data.guildId)
        .order("word"),
    ]);
    const config: Record<string, { enabled: boolean; settings: Record<string, JsonValue> }> = {};
    for (const key of Object.keys(DEFAULTS)) {
      const row = (rows ?? []).find((r) => r.module === key);
      config[key] = {
        enabled: row?.enabled ?? false,
        settings: (row?.settings as Record<string, JsonValue>) ?? {},
      };
    }
    const channels = await fetchBotGuildChannels(data.guildId);
    return {
      config,
      words: words ?? [],
      channels: channels
        .filter((c) => c.type === 0 || c.type === 5)
        .map((c) => ({ id: c.id, name: c.name })),
    };
  });

export const saveGuildConfig = createServerFn({ method: "POST" })
  .inputValidator((input: {
    guildId: string;
    module: string;
    enabled: boolean;
    settings: Record<string, JsonValue>;
  }) =>
    z
      .object({
        guildId: z.string().min(5),
        module: z.string().min(2),
        enabled: z.boolean(),
        settings: z.record(z.string(), z.custom<JsonValue>()),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { userId } = await requireGuildAccess(data.guildId);
    if (!(data.module in DEFAULTS)) throw new Error("Unknown module");
    const db = await admin();
    await db.from("guilds").upsert(
      { id: data.guildId, name: data.guildId, bot_present: true },
      { onConflict: "id", ignoreDuplicates: true },
    );
    const { error } = await db.from("guild_configs").upsert(
      {
        guild_id: data.guildId,
        module: data.module as ModuleKey,
        enabled: data.enabled,
        settings: data.settings,
        updated_by: userId,
      },
      { onConflict: "guild_id,module" },
    );
    if (error) throw new Error(error.message);
    await db.from("dashboard_audit").insert({
      guild_id: data.guildId,
      actor_id: userId,
      action: `config.${data.module}`,
      after_state: { enabled: data.enabled, settings: data.settings },
    });
    return { ok: true };
  });

export const listCases = createServerFn({ method: "POST" })
  .inputValidator((input: { guildId: string; search?: string }) =>
    z.object({ guildId: z.string().min(5), search: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    let query = db
      .from("mod_cases")
      .select(
        "id, case_number, action, target_id, target_tag, moderator_tag, reason, duration_seconds, active, created_at",
      )
      .eq("guild_id", data.guildId)
      .order("case_number", { ascending: false })
      .limit(100);
    if (data.search) query = query.ilike("target_tag", `%${data.search}%`);
    const { data: rows } = await query;
    return rows ?? [];
  });

export const listLogs = createServerFn({ method: "POST" })
  .inputValidator(guildInput)
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    const { data: rows } = await db
      .from("log_events")
      .select("id, category, event_type, actor_id, target_id, summary, created_at")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: false })
      .limit(100);
    return rows ?? [];
  });

export const getSecurityCenter = createServerFn({ method: "POST" })
  .inputValidator(guildInput)
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    const [events, lockdown, trusted] = await Promise.all([
      db
        .from("security_events")
        .select("id, system, event_type, severity, actor_tag, action_taken, resolved, created_at")
        .eq("guild_id", data.guildId)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("lockdowns")
        .select("id, mode, scope, reason, active, created_at")
        .eq("guild_id", data.guildId)
        .eq("active", true)
        .maybeSingle(),
      db
        .from("whitelists")
        .select("id, scope, entity_type, entity_id, label")
        .eq("guild_id", data.guildId),
    ]);
    return {
      events: events.data ?? [],
      lockdown: lockdown.data ?? null,
      trusted: trusted.data ?? [],
    };
  });

/** Dashboard → bot bridge: queue an action the bot executes on its next poll. */
export const queueBotTask = createServerFn({ method: "POST" })
  .inputValidator((input: {
    guildId: string;
    taskType: string;
    payload?: Record<string, JsonValue>;
  }) =>
    z
      .object({
        guildId: z.string().min(5),
        taskType: z.enum([
          "lockdown",
          "unlockdown",
          "raidmode_on",
          "raidmode_off",
          "reload_config",
          "announce",
          "sync_slash",
        ]),
        payload: z.record(z.string(), z.custom<JsonValue>()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { userId } = await requireGuildAccess(data.guildId);
    const db = await admin();
    const { error } = await db.from("bot_tasks").insert({
      guild_id: data.guildId,
      task_type: data.taskType,
      payload: data.payload ?? {},
      requested_by: userId,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addFilterWord = createServerFn({ method: "POST" })
  .inputValidator((input: { guildId: string; word: string }) =>
    z.object({ guildId: z.string().min(5), word: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    await db.from("filter_words").insert({
      guild_id: data.guildId,
      word: data.word.toLowerCase(),
      list_type: "blocked",
      match_mode: "partial",
    });
    return { ok: true };
  });

export const removeFilterWord = createServerFn({ method: "POST" })
  .inputValidator((input: { guildId: string; id: string }) =>
    z.object({ guildId: z.string().min(5), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireGuildAccess(data.guildId);
    const db = await admin();
    await db.from("filter_words").delete().eq("id", data.id).eq("guild_id", data.guildId);
    return { ok: true };
  });

export const getOwnerPanel = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await requireUser();
  if (!botOwnerIds().includes(userId)) throw new Error("NO_ACCESS");
  const db = await admin();
  const [status, guilds, errors, usage, blacklist] = await Promise.all([
    db.from("bot_status").select("*").order("shard_id").limit(5),
    db
      .from("guilds")
      .select("id, name, member_count, bot_present, blacklisted, last_seen_at")
      .order("member_count", { ascending: false })
      .limit(50),
    db
      .from("error_logs")
      .select("id, source, command, message, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    db.from("command_usage").select("command").limit(500),
    db.from("blacklist").select("id, entity_type, entity_id, reason").limit(50),
  ]);
  const counts = new Map<string, number>();
  for (const row of usage.data ?? [])
    counts.set(row.command, (counts.get(row.command) ?? 0) + 1);
  return {
    shards: status.data ?? [],
    guilds: guilds.data ?? [],
    errors: errors.data ?? [],
    blacklist: blacklist.data ?? [],
    topCommands: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([command, count]) => ({ command, count })),
  };
});
