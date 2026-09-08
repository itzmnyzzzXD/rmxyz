import { createServerFn } from "@tanstack/react-start";

export type BotStatus = {
  status: string;
  latencyMs: number | null;
  guildCount: number;
  userCount: number;
  commandsProcessed: number;
  updatedAt: string | null;
  version: string | null;
};

export const getBotStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<BotStatus> => {
    const fallback: BotStatus = {
      status: "offline",
      latencyMs: null,
      guildCount: 0,
      userCount: 0,
      commandsProcessed: 0,
      updatedAt: null,
      version: null,
    };
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data } = await supabaseAdmin
        .from("bot_status")
        .select(
          "status, latency_ms, guild_count, user_count, commands_processed, updated_at, version",
        )
        .order("shard_id", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!data) return fallback;
      const stale =
        Date.now() - new Date(data.updated_at).getTime() > 5 * 60 * 1000;
      return {
        status: stale ? "offline" : data.status,
        latencyMs: data.latency_ms,
        guildCount: data.guild_count,
        userCount: Number(data.user_count ?? 0),
        commandsProcessed: Number(data.commands_processed ?? 0),
        updatedAt: data.updated_at,
        version: data.version,
      };
    } catch {
      return fallback;
    }
  },
);
