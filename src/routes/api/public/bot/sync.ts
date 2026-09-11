import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { store, upsertGuild, trimStore } from "@/lib/rm/store.server";

const payloadSchema = z.object({
  action: z.enum(["heartbeat", "guilds", "config", "case", "command", "log", "security", "tasks", "task_done", "error", "catalog"]),
  data: z.record(z.string(), z.unknown()).default({}),
});

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (v == null ? fallback : Number(v));
const strn = (v: unknown): string | null => (v == null ? null : String(v));
const numn = (v: unknown): number | null => (v == null ? null : Number(v));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

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
        try {
          const configuredKey = (
            process.env["BOT_SYNC_KEY"] ?? process.env["BOT_API_KEY"] ?? ""
          ).trim();
          const provided = (request.headers.get("x-bot-key") ?? "").trim();

          if (!configuredKey) {
            console.error("BOT_SYNC_KEY is not configured on the dashboard");
            return json({ error: "bot sync is not configured" }, 503);
          }

          if (!provided || !timingSafeEqual(provided, configuredKey)) {
            return json({ error: "unauthorized" }, 401);
          }

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
              shard_id: num(data.shard_id), status: str(data.status, "online"), latency_ms: numn(data.latency_ms),
              guild_count: num(data.guild_count), user_count: num(data.user_count), commands_processed: num(data.commands_processed),
              memory_mb: numn(data.memory_mb), cpu_percent: numn(data.cpu_percent), started_at: strn(data.started_at),
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
              action: str(data.action_type, "warn"), target_id: str(data.target_id), target_tag: strn(data.target_tag),
              moderator_id: str(data.moderator_id), moderator_tag: strn(data.moderator_tag), reason: strn(data.reason),
              duration_seconds: numn(data.duration_seconds), active: true, created_at: now,
            });
            trimStore();
            return json({ ok: true, case_number: next });
          }
          if (action === "log") {
            store.logs.push({
              id: crypto.randomUUID(), guild_id: str(data.guild_id), category: str(data.category, "server"),
              event_type: str(data.event_type, "event"), actor_id: strn(data.actor_id), target_id: strn(data.target_id),
              channel_id: strn(data.channel_id), summary: strn(data.summary), created_at: now,
            });
            trimStore();
            return json({ ok: true });
          }
          if (action === "security") {
            store.security.push({
              id: crypto.randomUUID(), guild_id: str(data.guild_id), system: str(data.system, "antinuke"),
              event_type: str(data.event_type, "event"), severity: str(data.severity, "medium"), actor_id: strn(data.actor_id),
              actor_tag: strn(data.actor_tag), action_taken: strn(data.action_taken), resolved: false, created_at: now,
            });
            trimStore();
            return json({ ok: true });
          }
          if (action === "command") {
            store.usage.push({
              guildId: (strn(data.guild_id)) as string | null, command: str(data.command, "unknown"),
              userId: strn(data.user_id), success: Boolean(data.success ?? true), createdAt: now,
            });
            trimStore();
            return json({ ok: true });
          }
          if (action === "error") {
            store.errors.push({ id: crypto.randomUUID(), source: "bot", guild_id: strn(data.guild_id),
              command: strn(data.command), message: str(data.message, "unknown error").slice(0, 2000), created_at: now });
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
        } catch (error) {
          console.error("bot sync handler failed", error instanceof Error ? error.message : "unknown error");
          return json({ error: "bot_sync_error" }, 500);
        }
      },
    },
  },
});
