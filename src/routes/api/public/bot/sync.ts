import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Single sync endpoint used by the Python bot (bot/bot.py).
 * Auth: shared secret in the `x-bot-key` header (BOT_SYNC_KEY / BOT_API_KEY).
 */
const payloadSchema = z.object({
  action: z.enum(["heartbeat", "guilds", "config", "case", "command"]),
  data: z.record(z.string(), z.unknown()).default({}),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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

        if (action === "heartbeat") {
          const { error } = await supabaseAdmin.from("bot_status").upsert(
            {
              shard_id: Number(data["shard_id"] ?? 0),
              status: String(data["status"] ?? "online"),
              latency_ms: data["latency_ms"] as number | null,
              guild_count: Number(data["guild_count"] ?? 0),
              user_count: Number(data["user_count"] ?? 0),
              commands_processed: Number(data["commands_processed"] ?? 0),
              memory_mb: (data["memory_mb"] ?? null) as number | null,
              started_at: (data["started_at"] ?? null) as string | null,
              version: String(data["version"] ?? "1.0.0"),
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
            const { error } = await supabaseAdmin.from("guilds").upsert(
              rows.map((g) => ({
                id: String(g["id"]),
                name: String(g["name"] ?? "Unknown"),
                icon: (g["icon"] ?? null) as string | null,
                owner_id: (g["owner_id"] ?? null) as string | null,
                member_count: Number(g["member_count"] ?? 0),
                channel_count: Number(g["channel_count"] ?? 0),
                role_count: Number(g["role_count"] ?? 0),
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
          const guildId = String(data["guild_id"] ?? "");
          const { data: rows, error } = await supabaseAdmin
            .from("guild_configs")
            .select("module, enabled, settings")
            .eq("guild_id", guildId);
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true, config: rows ?? [] });
        }

        if (action === "case") {
          const guildId = String(data["guild_id"] ?? "");
          const { data: num, error: numError } = await supabaseAdmin.rpc(
            "next_case_number",
            { p_guild_id: guildId },
          );
          if (numError) return json({ error: numError.message }, 500);
          const { error } = await supabaseAdmin.from("mod_cases").insert({
            guild_id: guildId,
            case_number: Number(num),
            action: String(data["action_type"] ?? "warn"),
            target_id: String(data["target_id"] ?? ""),
            target_tag: (data["target_tag"] ?? null) as string | null,
            moderator_id: String(data["moderator_id"] ?? ""),
            moderator_tag: (data["moderator_tag"] ?? null) as string | null,
            reason: (data["reason"] ?? null) as string | null,
            duration_seconds: (data["duration_seconds"] ?? null) as
              | number
              | null,
          });
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true, case_number: Number(num) });
        }

        // command usage
        const { error } = await supabaseAdmin.from("command_usage").insert({
          guild_id: (data["guild_id"] ?? null) as string | null,
          command: String(data["command"] ?? "unknown"),
          user_id: (data["user_id"] ?? null) as string | null,
          success: Boolean(data["success"] ?? true),
        });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});
