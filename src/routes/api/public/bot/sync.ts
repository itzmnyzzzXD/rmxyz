import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Single sync endpoint used by the Python bot (bot/bot.py).
 * Auth: shared secret in the `x-bot-key` header (BOT_SYNC_KEY / BOT_API_KEY).
 */
const payloadSchema = z.object({
  action: z.enum([
    "heartbeat",
    "guilds",
    "config",
    "case",
    "command",
    "log",
    "security",
    "tasks",
    "task_done",
    "error",
    "catalog",
  ]),
  data: z.record(z.string(), z.unknown()).default({}),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const str = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (v == null ? fallback : Number(v));

export const Route = createFileRoute("/api/public/bot/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env["BOT_SYNC_KEY"] ?? process.env["BOT_API_KEY"] ?? "";
        const provided = request.headers.get("x-bot-key") ?? "";
        if (!expected || provided !== expected) {
          return json({ error: "unauthorized" }, 401);
        }

        const parsed = payloadSchema.safeParse(await request.json());
        if (!parsed.success) return json({ error: "invalid payload" }, 400);
        const { action, data } = parsed.data;

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const db = supabaseAdmin;

        if (action === "heartbeat") {
          const { error } = await db.from("bot_status").upsert(
            {
              shard_id: num(data["shard_id"]),
              status: str(data["status"], "online"),
              latency_ms: (data["latency_ms"] ?? null) as number | null,
              guild_count: num(data["guild_count"]),
              user_count: num(data["user_count"]),
              commands_processed: num(data["commands_processed"]),
              memory_mb: (data["memory_mb"] ?? null) as number | null,
              cpu_percent: (data["cpu_percent"] ?? null) as number | null,
              started_at: (data["started_at"] ?? null) as string | null,
              version: str(data["version"], "1.0.0"),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "shard_id" },
          );
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true });
        }

        if (action === "guilds") {
          const rows = (data["guilds"] as Array<Record<string, unknown>>) ?? [];
          if (rows.length) {
            const { error } = await db.from("guilds").upsert(
              rows.map((g) => ({
                id: str(g["id"]),
                name: str(g["name"], "Unknown"),
                icon: (g["icon"] ?? null) as string | null,
                owner_id: (g["owner_id"] ?? null) as string | null,
                member_count: num(g["member_count"]),
                channel_count: num(g["channel_count"]),
                role_count: num(g["role_count"]),
                bot_present: true,
                last_seen_at: new Date().toISOString(),
              })),
              { onConflict: "id" },
            );
            if (error) return json({ error: error.message }, 500);
          }
          return json({ ok: true, count: rows.length });
        }

        if (action === "config") {
          const guildId = str(data["guild_id"]);
          const [{ data: rows, error }, { data: words }] = await Promise.all([
            db
              .from("guild_configs")
              .select("module, enabled, settings")
              .eq("guild_id", guildId),
            db
              .from("filter_words")
              .select("word, list_type, match_mode")
              .eq("guild_id", guildId),
          ]);
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true, config: rows ?? [], words: words ?? [] });
        }

        if (action === "case") {
          const guildId = str(data["guild_id"]);
          const { data: nextNumber, error: numError } = await db.rpc(
            "next_case_number",
            { p_guild: guildId },
          );
          if (numError) return json({ error: numError.message }, 500);
          const { error } = await db.from("mod_cases").insert({
            guild_id: guildId,
            case_number: Number(nextNumber),
            action: str(data["action_type"], "warn"),
            target_id: str(data["target_id"]),
            target_tag: (data["target_tag"] ?? null) as string | null,
            moderator_id: str(data["moderator_id"]),
            moderator_tag: (data["moderator_tag"] ?? null) as string | null,
            reason: (data["reason"] ?? null) as string | null,
            duration_seconds: (data["duration_seconds"] ?? null) as number | null,
            source: str(data["source"], "bot"),
          });
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true, case_number: Number(nextNumber) });
        }

        if (action === "log") {
          const { error } = await db.from("log_events").insert({
            guild_id: str(data["guild_id"]),
            category: str(data["category"], "server"),
            event_type: str(data["event_type"], "event"),
            actor_id: (data["actor_id"] ?? null) as string | null,
            target_id: (data["target_id"] ?? null) as string | null,
            channel_id: (data["channel_id"] ?? null) as string | null,
            summary: (data["summary"] ?? null) as string | null,
          });
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true });
        }

        if (action === "security") {
          const { error } = await db.from("security_events").insert({
            guild_id: str(data["guild_id"]),
            system: str(data["system"], "antinuke"),
            event_type: str(data["event_type"], "event"),
            severity: str(data["severity"], "medium"),
            actor_id: (data["actor_id"] ?? null) as string | null,
            actor_tag: (data["actor_tag"] ?? null) as string | null,
            action_taken: (data["action_taken"] ?? null) as string | null,
          });
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true });
        }

        if (action === "tasks") {
          const { data: rows, error } = await db
            .from("bot_tasks")
            .select("id, guild_id, task_type, payload")
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(20);
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true, tasks: rows ?? [] });
        }

        if (action === "task_done") {
          const { error } = await db
            .from("bot_tasks")
            .update({
              status: data["error"] ? "failed" : "done",
              error: (data["error"] ?? null) as string | null,
              processed_at: new Date().toISOString(),
            })
            .eq("id", str(data["id"]));
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true });
        }

        if (action === "error") {
          await db.from("error_logs").insert({
            source: "bot",
            guild_id: (data["guild_id"] ?? null) as string | null,
            command: (data["command"] ?? null) as string | null,
            message: str(data["message"], "unknown error").slice(0, 2000),
            stack: (data["stack"] ?? null) as string | null,
          });
          return json({ ok: true });
        }

        if (action === "catalog") {
          await db.from("global_settings").upsert({
            key: "command_catalog",
            value: (data["commands"] ?? []) as never,
            updated_at: new Date().toISOString(),
          });
          return json({ ok: true });
        }

        // command usage
        const { error } = await db.from("command_usage").insert({
          guild_id: (data["guild_id"] ?? null) as string | null,
          command: str(data["command"], "unknown"),
          user_id: (data["user_id"] ?? null) as string | null,
          success: Boolean(data["success"] ?? true),
        });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});
