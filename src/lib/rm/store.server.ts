export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Guild = {
  id: string;
  name: string;
  icon: string | null;
  ownerId?: string | null;
  memberCount: number;
  channelCount: number;
  roleCount: number;
  botPresent: boolean;
  blacklisted?: boolean;
  lastSeenAt: string | null;
};

type Row = { [key: string]: JsonValue | undefined };
export type CaseRow = Row & { guild_id: string; created_at: string; case_number?: number; target_tag?: string | null };
export type SecurityRow = Row & { guild_id: string; created_at: string };
export type LogRow = Row & { guild_id: string; created_at: string };
export type StatRow = Row & { guild_id: string; day: string };
export type StatusRow = Row & { shard_id: number };
type Task = { id: string; guildId: string; taskType: string; payload: Record<string, JsonValue>; requestedBy?: string | null; status: string; error?: string | null; createdAt: string; processedAt?: string | null };

type Store = {
  status: StatusRow[];
  guilds: Map<string, Guild>;
  configs: Map<string, { enabled: boolean; settings: Record<string, JsonValue> }>;
  words: Map<string, { id: string; guildId: string; word: string; listType: string; matchMode: string }>;
  cases: CaseRow[];
  security: SecurityRow[];
  logs: LogRow[];
  stats: StatRow[];
  usage: { guildId: string | null; command: string; userId?: string | null; success: boolean; createdAt: string }[];
  tasks: Task[];
  errors: Row[];
  blacklist: Row[];
};

const g = globalThis as typeof globalThis & { __rmxyzStore?: Store };

export const store: Store = g.__rmxyzStore ??= {
  status: [],
  guilds: new Map(),
  configs: new Map(),
  words: new Map(),
  cases: [],
  security: [],
  logs: [],
  stats: [],
  usage: [],
  tasks: [],
  errors: [],
  blacklist: [],
};

export function upsertGuild(data: Partial<Guild> & { id: string }) {
  const old = store.guilds.get(data.id);
  const next: Guild = {
    id: data.id,
    name: data.name ?? old?.name ?? data.id,
    icon: data.icon ?? old?.icon ?? null,
    ownerId: data.ownerId ?? old?.ownerId ?? null,
    memberCount: data.memberCount ?? old?.memberCount ?? 0,
    channelCount: data.channelCount ?? old?.channelCount ?? 0,
    roleCount: data.roleCount ?? old?.roleCount ?? 0,
    botPresent: data.botPresent ?? old?.botPresent ?? true,
    blacklisted: data.blacklisted ?? old?.blacklisted ?? false,
    lastSeenAt: data.lastSeenAt ?? old?.lastSeenAt ?? new Date().toISOString(),
  };
  store.guilds.set(data.id, next);
  return next;
}

export function queueTask(task: Omit<Task, "id" | "createdAt" | "status">) {
  const next: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "pending" };
  store.tasks.push(next);
  return next;
}

export function trimStore() {
  store.cases.splice(2000);
  store.security.splice(2000);
  store.logs.splice(5000);
  store.usage.splice(10000);
  store.errors.splice(2000);
  store.stats.splice(5000);
  store.tasks.splice(2000);
}
