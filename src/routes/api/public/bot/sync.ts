import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { store, upsertGuild, trimStore } from "@/lib/rm/store.server";

const payloadSchema = z.object({
  action: z.enum(["heartbeat", "guilds", "config", "case", "command", "log", "security", "tasks", "task_done", "error", "catalog"]),
  data: z.record(z.string(), z.unknown()).default({}),
});

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (v == null ? fallback : Number(v));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/bot/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-bot-key") ?? "";
        const configuredKey = process.env["BOT_SYNC_KEY"] ?? process.env["BOT_API_KEY"] ?? "";
        const botToken = process.env["DISCORD_BOT_TOKEN"] ?? "";
        const derivedKey = botToken ? await crypto.subtle.digest("SHA-256", new TextEncoder().encode(botToken)).then((buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("")) : "";

        const authorized = Boolean(provided) &&
          ((Boolean(configuredKey) && timingSafeEqual(provided, configuredKey)) ||
           (Boolean(derivedKey) && timingSafeEqual(provided, derivedKey)));
        if (!authorized) return json({ error: "unauthorized" }, 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid json" }, 400);
        }
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid payload" }, 400);
        const { action, data } = parsed.data;
        const now = new Date().toISOString();

        if (action === "heartbeat") {
          const row = {
            shard_id: num(data.shard_id), status: str(data.status, "online"), latency_ms: data.latency_ms ?? null,
            guild_count: num(data.guild_count), user_count: num(data.user_count), commands_processed: num(data.commands_processed),
            memory_mb: data.memory_mb ?? null, cpu_percent: data.cpu_percent ?? null, started_at: data.started_at ?? null,
            version: str(data.version, "1.0.0"), updated_at: now,
          };
          const index = store.status.findIndex((x) => x.shard_id === row.shard_id);
          if (index >= 0) store.status[index] = row; else store.status.push(row);
          trimStore();
          return json({ ok: true });
        }
        if (action === "guilds") {
          const rows = (data.guilds as Array<Record<string, unknown>>) ?? [];
          for (const g of rows) upsertGuild({
            id: str(g.id), name: str(g.name, "Unknown"), icon: (g.icon ?? null) as string | null,
            ownerId: (g.owner_id ?? null) as string | null, memberCount: num(g.member_count),
            channelCount: num(g.channel_count), roleCount: num(g.role_count), botPresent: true, lastSeenAt: now,
          });
          trimStore();
          return json({ ok: true, count: rows.length });
        }
        if (action === "config") {
          const guildId = str(data.guild_id);
          const config = [...store.configs.entries()]
            .filter(([key]) => key.startsWith(`${guildId}:`))
            .map(([key, value]) => ({ module: key.slice(guildId.length + 1), ...value }));
          const words = [...store.words.values()]
            .filter((x) => x.guildId === guildId)
            .map((x) => ({ word: x.word, list_type: x.listType, match_mode: x.matchMode }));
          return json({ ok: true, config, words });
        }
        if (action === "case") {
          const guildId = str(data.guild_id);
          const next = store.cases.filter((x) => x.guild_id === guildId).reduce((m, x) => Math.max(m, Number(x.case_number ?? 0)), 0) + 1;
          store.cases.push({
            id: crypto.randomUUID(), guild_id: guildId, case_number: next,
            action: str(data.action_type, "warn"), target_id: str(data.target_id), target_tag: data.target_tag ?? null,
            moderator_id: str(data.moderator_id), moderator_tag: data.moderator_tag ?? null, reason: data.reason ?? null,
            duration_seconds: data.duration_seconds ?? null, active: true, created_at: now,
          });
          trimStore();
          return json({ ok: true, case_number: next });
        }
        if (action === "log") {
          store.logs.push({
            id: crypto.randomUUID(), guild_id: str(data.guild_id), category: str(data.category, "server"),
            event_type: str(data.event_type, "event"), actor_id: data.actor_id ?? null, target_id: data.target_id ?? null,
            channel_id: data.channel_id ?? null, summary: data.summary ?? null, created_at: now,
          });
          trimStore();
          return json({ ok: true });
        }
        if (action === "security") {
          store.security.push({
            id: crypto.randomUUID(), guild_id: str(data.guild_id), system: str(data.system, "antinuke"),
            event_type: str(data.event_type, "event"), severity: str(data.severity, "medium"), actor_id: data.actor_id ?? null,
            actor_tag: data.actor_tag ?? null, action_taken: data.action_taken ?? null, resolved: false, created_at: now,
          });
          trimStore();
          return json({ ok: true });
        }
        if (action === "command") {
          store.usage.push({
            guildId: (data.guild_id ?? null) as string | null, command: str(data.command, "unknown"),
            userId: (data.user_id ?? null) as string | null, success: Boolean(data.success ?? true), createdAt: now,
          });
          trimStore();
          return json({ ok: true });
        }
        if (action === "error") {
          store.errors.push({ id: crypto.randomUUID(), source: "bot", guild_id: data.guild_id ?? null,
            command: data.command ?? null, message: str(data.message, "unknown error").slice(0, 2000), created_at: now });
          trimStore();
          return json({ ok: true });
        }
        if (action === "catalog") return json({ ok: true });
        if (action === "tasks") {
          const tasks = store.tasks.filter((t) => t.status === "pending").slice(0, 20);
          return json({ ok: true, tasks: tasks.map((t) => ({ id: t.id, guild_id: t.guildId, task_type: t.taskType, payload: t.payload })) });
        }
        if (action === "task_done") {
          const task = store.tasks.find((t) => t.id === str(data.id));
          if (task) {
            task.status = data.error ? "failed" : "done";
            task.error = data.error ? str(data.error) : null;
            task.processedAt = now;
          }
          return json({ ok: true });
        }
        trimStore();
        return json({ ok: true });
      },
    },
  },
});
