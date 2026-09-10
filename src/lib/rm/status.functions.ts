import { createServerFn } from "@tanstack/react-start";
import { store } from "@/lib/rm/store.server";

export type BotStatus = {
  status: string;
  latencyMs: number | null;
  guildCount: number;
  userCount: number;
  commandsProcessed: number;
  updatedAt: string | null;
  version: string | null;
};

export const getBotStatus = createServerFn({ method: "GET" }).handler(async (): Promise<BotStatus> => {
  const row = store.status[0] as Record<string, unknown> | undefined;
  if (!row) return { status: "offline", latencyMs: null, guildCount: 0, userCount: 0, commandsProcessed: 0, updatedAt: null, version: null };
  const updatedAt = String(row.updated_at ?? "");
  const stale = !updatedAt || Date.now() - new Date(updatedAt).getTime() > 5 * 60 * 1000;
  return {
    status: stale ? "offline" : String(row.status ?? "online"),
    latencyMs: row.latency_ms == null ? null : Number(row.latency_ms),
    guildCount: Number(row.guild_count ?? 0),
    userCount: Number(row.user_count ?? 0),
    commandsProcessed: Number(row.commands_processed ?? 0),
    updatedAt: updatedAt || null,
    version: row.version == null ? null : String(row.version),
  };
});
