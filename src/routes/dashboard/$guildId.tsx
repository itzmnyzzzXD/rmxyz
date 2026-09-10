import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Lock,
  LogOut,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Terminal,
  Unlock,
  Users,
  X,
} from "lucide-react";
import {
  addFilterWord,
  getGuildConfig,
  getGuildOverview,
  getSessionUser,
  getSecurityCenter,
  listCases,
  listLogs,
  queueBotTask,
  removeFilterWord,
  saveGuildConfig,
} from "@/lib/rm/dashboard.functions";
import { DEFAULTS, MODULE_META, deepMerge, type ModuleKey } from "@/lib/rm/modules";

type Tab = "overview" | "modules" | "security" | "logs" | "cases";

export const Route = createFileRoute("/dashboard/$guildId")({
  head: () => ({ meta: [{ title: "Dashboard — RM" }] }),
  component: GuildDashboard,
});

function GuildDashboard() {
  const { guildId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedModule, setSelectedModule] = useState<ModuleKey>("core");
  const [search, setSearch] = useState("");
  const [word, setWord] = useState("");
  const [editor, setEditor] = useState("{}");
  const [enabled, setEnabled] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const user = useQuery({ queryKey: ["session-user"], queryFn: getSessionUser });
  const overview = useQuery({
    queryKey: ["guild-overview", guildId],
    queryFn: () => getGuildOverview({ data: { guildId } }),
    retry: 1,
  });
  const config = useQuery({
    queryKey: ["guild-config", guildId],
    queryFn: () => getGuildConfig({ data: { guildId } }),
    retry: 1,
  });
  const security = useQuery({
    queryKey: ["guild-security", guildId],
    queryFn: () => getSecurityCenter({ data: { guildId } }),
    enabled: tab === "security",
  });
  const logs = useQuery({
    queryKey: ["guild-logs", guildId],
    queryFn: () => listLogs({ data: { guildId } }),
    enabled: tab === "logs",
  });
  const cases = useQuery({
    queryKey: ["guild-cases", guildId, search],
    queryFn: () => listCases({ data: { guildId, search: search || undefined } }),
    enabled: tab === "cases",
  });

  useEffect(() => {
    const remote = config.data?.config?.[selectedModule];
    const base = DEFAULTS[selectedModule] ?? {};
    const merged = deepMerge(base, remote?.settings ?? {}) as Record<string, unknown>;
    setEditor(JSON.stringify(merged, null, 2));
    setEnabled(Boolean(remote?.enabled));
  }, [config.data, selectedModule]);

  const save = useMutation({
    mutationFn: (payload: { module: string; enabled: boolean; settings: Record<string, unknown> }) =>
      saveGuildConfig({ data: { guildId, module: payload.module, enabled: payload.enabled, settings: payload.settings as never } }),
    onSuccess: async () => {
      setSaveMessage("Saved and queued for RM");
      await queryClient.invalidateQueries({ queryKey: ["guild-config", guildId] });
      setTimeout(() => setSaveMessage(""), 3000);
    },
    onError: (error) => setSaveMessage(error instanceof Error ? error.message : "Couldn’t save"),
  });

  const task = useMutation({
    mutationFn: (taskType: "lockdown" | "unlockdown" | "raidmode_on" | "raidmode_off" | "sync_slash") =>
      queueBotTask({ data: { guildId, taskType } }),
  });

  const addWord = useMutation({
    mutationFn: (value: string) => addFilterWord({ data: { guildId, word: value } }),
    onSuccess: async () => {
      setWord("");
      await queryClient.invalidateQueries({ queryKey: ["guild-config", guildId] });
    },
  });
  const removeWord = useMutation({
    mutationFn: (id: string) => removeFilterWord({ data: { guildId, id } }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["guild-config", guildId] }),
  });

  const guild = overview.data?.guild;
  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MODULE_META.filter((m) => !q || m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }, [search]);

  if (user.isLoading || overview.isLoading || config.isLoading) return <Loading />;
  if (!user.data) return <RedirectCard onClick={() => navigate({ to: "/login" })} />;
  if (overview.error || config.error) return <ErrorCard />;

  return (
    <main className="min-h-screen bg-[#070709] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070709]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/servers" className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden h-7 w-px bg-white/10 sm:block" />
            {guild?.icon ? <img src={guild.icon} alt="" className="h-9 w-9 rounded-xl" /> : <div className="h-9 w-9 rounded-xl bg-white/5" />}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{guild?.name ?? "Server"}</p>
              <p className="text-[11px] text-zinc-500">RM server control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex ${guild?.botPresent ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${guild?.botPresent ? "bg-emerald-400" : "bg-amber-400"}`} />
              {guild?.botPresent ? "Bot connected" : "Bot not detected"}
            </span>
            <a href="/api/auth/logout" className="rounded-xl border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.025] p-1">
          {([
            ["overview", Activity, "Overview"],
            ["modules", Settings2, "Modules"],
            ["security", ShieldAlert, "Security"],
            ["logs", FileText, "Logs"],
            ["cases", BookOpen, "Cases"],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === key ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <Overview guild={guild} data={overview.data} onTask={(value) => task.mutate(value)} pending={task.isPending} />
        )}

        {tab === "modules" && (
          <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                <Search className="h-4 w-4 text-zinc-600" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a module..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
              </div>
              <div className="mt-3 space-y-1">
                {filteredModules.map((module) => {
                  const active = selectedModule === module.key;
                  const on = Boolean(config.data?.config?.[module.key]?.enabled);
                  return (
                    <button key={module.key} onClick={() => setSelectedModule(module.key)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${active ? "bg-red-500/10 ring-1 ring-red-400/20" : "hover:bg-white/[0.04]"}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-zinc-500"}`}><Settings2 className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{module.label}</p>
                        <p className="truncate text-xs text-zinc-600">{on ? "Enabled" : "Disabled"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-700" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-red-400">Module editor</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{MODULE_META.find((m) => m.key === selectedModule)?.label}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-500">{MODULE_META.find((m) => m.key === selectedModule)?.description}</p>
                </div>
                <button onClick={() => setEnabled((v) => !v)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${enabled ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>
                  <span className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-medium text-zinc-400">Settings JSON</p>
                  <p className="text-[11px] text-zinc-600">Advanced editor · valid JSON required</p>
                </div>
                <textarea value={editor} onChange={(e) => setEditor(e.target.value)} spellCheck={false} className="min-h-[430px] w-full resize-y rounded-xl border border-white/5 bg-[#050506] p-4 font-mono text-xs leading-6 text-zinc-300 outline-none focus:border-red-400/30" />
              </div>

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-zinc-500">Changes are queued to the VPS bot after saving.</div>
                <div className="flex items-center gap-3">
                  {saveMessage && <span className={`text-xs ${saveMessage.includes("Saved") ? "text-emerald-300" : "text-amber-300"}`}>{saveMessage}</span>}
                  <button
                    disabled={save.isPending}
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(editor) as Record<string, unknown>;
                        save.mutate({ module: selectedModule, enabled, settings: parsed });
                      } catch {
                        setSaveMessage("Invalid JSON");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-red-400 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save module
                  </button>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex items-end justify-between gap-3">
                  <div><h3 className="font-semibold">Blocked words</h3><p className="mt-1 text-xs text-zinc-500">Add words to the server word filter.</p></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={word} onChange={(e) => setWord(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && word.trim()) addWord.mutate(word.trim()); }} placeholder="Add a blocked word..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-700 focus:border-red-400/30" />
                  <button disabled={!word.trim() || addWord.isPending} onClick={() => addWord.mutate(word.trim())} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium transition hover:bg-white/10 disabled:opacity-40">Add</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(config.data?.words ?? []).map((item) => {
                    const id = "id" in item ? String((item as { id?: string }).id ?? "") : "";
                    return <span key={id || item.word} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300"><Filter className="h-3 w-3 text-zinc-600" />{item.word}<button aria-label={`Remove ${item.word}`} onClick={() => id && removeWord.mutate(id)} className="text-zinc-600 hover:text-white"><X className="h-3 w-3" /></button></span>;
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === "security" && <SecurityTab events={security.data?.events ?? []} onTask={(v) => task.mutate(v)} pending={task.isPending} />}
        {tab === "logs" && <LogsTab rows={logs.data ?? []} />}
        {tab === "cases" && <CasesTab rows={cases.data ?? []} search={search} setSearch={setSearch} />}
      </div>
    </main>
  );
}

function Overview({ guild, data, onTask, pending }: { guild?: { memberCount: number; channelCount: number; roleCount: number; botPresent: boolean; lastSeenAt: string | null } | null; data: Awaited<ReturnType<typeof getGuildOverview>>; onTask: (v: "lockdown" | "unlockdown" | "raidmode_on" | "raidmode_off" | "sync_slash") => void; pending: boolean }) {
  const stats = [
    ["Members", guild?.memberCount ?? 0, Users],
    ["Channels", guild?.channelCount ?? 0, Terminal],
    ["Roles", guild?.roleCount ?? 0, ShieldCheck],
    ["Security events", data.security.length, Siren],
  ] as const;
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon]) => <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center justify-between"><p className="text-sm text-zinc-500">{label}</p><Icon className="h-4 w-4 text-zinc-700" /></div><p className="mt-4 text-3xl font-semibold">{Number(value).toLocaleString()}</p></div>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-red-400">Command activity</p><h2 className="mt-1 text-xl font-semibold">Top commands</h2></div><Activity className="h-5 w-5 text-zinc-700" /></div>
          <div className="mt-6 space-y-3">
            {data.topCommands.length ? data.topCommands.map((row, index) => <div key={row.command} className="flex items-center gap-3"><span className="w-6 text-xs text-zinc-700">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-300">{row.command}</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-red-500" style={{ width: `${Math.max(8, (row.count / data.topCommands[0].count) * 100)}%` }} /></div><span className="w-8 text-right text-xs text-zinc-500">{row.count}</span></div>) : <Empty text="No command activity received yet." />}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-red-400">Quick actions</p>
          <h2 className="mt-1 text-xl font-semibold">Server controls</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <ActionButton icon={Lock} label="Lockdown" onClick={() => onTask("lockdown")} pending={pending} danger />
            <ActionButton icon={Unlock} label="Unlockdown" onClick={() => onTask("unlockdown")} pending={pending} />
            <ActionButton icon={Siren} label="Enable raid mode" onClick={() => onTask("raidmode_on")} pending={pending} />
            <ActionButton icon={RefreshCw} label="Sync slash commands" onClick={() => onTask("sync_slash")} pending={pending} />
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-zinc-600"><Clock3 className="h-3.5 w-3.5" /> Last bot sync: {guild?.lastSeenAt ? new Date(guild.lastSeenAt).toLocaleString() : "not received"}</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-red-400" /><h2 className="font-semibold">Recent moderation</h2></div><div className="mt-4 space-y-2">{data.cases.length ? data.cases.map((row, i) => <div key={String(row.id ?? i)} className="rounded-2xl border border-white/5 bg-black/15 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm text-zinc-300">Case #{String(row.case_number ?? "—")}</span><span className="text-xs text-zinc-600">{row.action as string}</span></div><p className="mt-1 text-xs text-zinc-600 truncate">{String(row.reason ?? "No reason provided")}</p></div>) : <Empty text="No moderation cases yet." />}</div></div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-400" /><h2 className="font-semibold">Security feed</h2></div><div className="mt-4 space-y-2">{data.security.length ? data.security.map((row, i) => <div key={String(row.id ?? i)} className="rounded-2xl border border-white/5 bg-black/15 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm text-zinc-300">{String(row.system ?? "security")}</span><span className="text-xs text-red-300">{String(row.severity ?? "medium")}</span></div><p className="mt-1 text-xs text-zinc-600 truncate">{String(row.event_type ?? "event")} · {String(row.action_taken ?? "no action")}</p></div>) : <Empty text="No security events yet." />}</div></div>
      </section>
    </div>
  );
}

function SecurityTab({ events, onTask, pending }: { events: Array<Record<string, unknown>>; onTask: (v: "lockdown" | "unlockdown" | "raidmode_on" | "raidmode_off" | "sync_slash") => void; pending: boolean }) {
  return <div className="space-y-5"><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ActionButton icon={Lock} label="Lockdown" onClick={() => onTask("lockdown")} pending={pending} danger /><ActionButton icon={Unlock} label="Unlockdown" onClick={() => onTask("unlockdown")} pending={pending} /><ActionButton icon={Siren} label="Raid mode ON" onClick={() => onTask("raidmode_on")} pending={pending} danger /><ActionButton icon={ShieldCheck} label="Raid mode OFF" onClick={() => onTask("raidmode_off")} pending={pending} /></section><section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-400" /><div><h2 className="font-semibold">Security event stream</h2><p className="text-xs text-zinc-600">Latest events reported by RM.</p></div></div><div className="mt-5 divide-y divide-white/5">{events.length ? events.map((row, i) => <div key={String(row.id ?? i)} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10"><AlertTriangle className="h-4 w-4 text-red-300" /></div><div className="min-w-0 flex-1"><p className="text-sm text-zinc-300">{String(row.event_type ?? "Security event")}</p><p className="mt-1 truncate text-xs text-zinc-600">{String(row.system ?? "security")} · actor {String(row.actor_tag ?? row.actor_id ?? "unknown")}</p></div><span className="text-xs uppercase text-zinc-500">{String(row.severity ?? "medium")}</span></div>) : <Empty text="No security events have been reported." />}</div></section></div>;
}

function LogsTab({ rows }: { rows: Array<Record<string, unknown>> }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-red-400" /><div><h2 className="font-semibold">Server logs</h2><p className="text-xs text-zinc-600">Latest 100 events stored by the dashboard.</p></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-white/5"><div className="divide-y divide-white/5">{rows.length ? rows.map((row, i) => <div key={String(row.id ?? i)} className="grid gap-2 p-4 sm:grid-cols-[140px_160px_1fr_150px]"><span className="text-xs text-zinc-600">{String(row.created_at ?? "")}</span><span className="text-xs font-medium text-zinc-400">{String(row.event_type ?? "event")}</span><span className="truncate text-sm text-zinc-300">{String(row.summary ?? "No summary")}</span><span className="text-xs text-zinc-600">{String(row.category ?? "server")}</span></div>) : <div className="p-8"><Empty text="No logs have arrived yet." /></div>}</div></div></section>;
}

function CasesTab({ rows, search, setSearch }: { rows: Array<Record<string, unknown>>; search: string; setSearch: (v: string) => void }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Moderation cases</h2><p className="text-xs text-zinc-600">Search the latest 100 cases by target tag.</p></div><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"><Search className="h-4 w-4 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a user..." className="w-48 bg-transparent text-sm outline-none placeholder:text-zinc-700" /></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-600"><tr><th className="px-3 py-3">Case</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Target</th><th className="px-3 py-3">Moderator</th><th className="px-3 py-3">Reason</th><th className="px-3 py-3">Created</th></tr></thead><tbody className="divide-y divide-white/5">{rows.length ? rows.map((row, i) => <tr key={String(row.id ?? i)} className="text-sm"><td className="px-3 py-3 font-mono text-zinc-400">#{String(row.case_number ?? "—")}</td><td className="px-3 py-3 text-zinc-300">{String(row.action ?? "warn")}</td><td className="px-3 py-3 text-zinc-400">{String(row.target_tag ?? row.target_id ?? "unknown")}</td><td className="px-3 py-3 text-zinc-500">{String(row.moderator_tag ?? row.moderator_id ?? "unknown")}</td><td className="max-w-[260px] truncate px-3 py-3 text-zinc-500">{String(row.reason ?? "No reason")}</td><td className="px-3 py-3 text-xs text-zinc-600">{String(row.created_at ?? "")}</td></tr>) : <tr><td colSpan={6} className="px-3 py-10"><Empty text="No moderation cases found." /></td></tr>}</tbody></table></div></section>;
}

function ActionButton({ icon: Icon, label, onClick, pending, danger = false }: { icon: typeof Lock; label: string; onClick: () => void; pending: boolean; danger?: boolean }) {
  return <button disabled={pending} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:opacity-50 ${danger ? "border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15" : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"}`}><Icon className="h-4 w-4" />{pending ? "Sending..." : label}</button>;
}

function Empty({ text }: { text: string }) { return <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-600"><Check className="h-4 w-4" />{text}</div>; }
function Loading() { return <main className="min-h-screen bg-[#070709] p-5"><div className="mx-auto max-w-[1500px]"><div className="h-10 w-64 animate-pulse rounded-2xl bg-white/5" /><div className="mt-5 h-14 animate-pulse rounded-2xl bg-white/[0.03]" /><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl border border-white/5 bg-white/[0.02]" />)}</div></div></main>; }
function RedirectCard({ onClick }: { onClick: () => void }) { return <main className="flex min-h-screen items-center justify-center bg-[#070709] px-4 text-white"><div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center"><LogOut className="mx-auto h-9 w-9 text-zinc-600" /><h1 className="mt-5 text-2xl font-semibold">Your session expired</h1><p className="mt-2 text-sm text-zinc-500">Sign in with Discord again to continue.</p><button onClick={onClick} className="mt-6 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold">Back to login</button></div></main>; }
function ErrorCard() { return <main className="flex min-h-screen items-center justify-center bg-[#070709] px-4 text-white"><div className="max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center"><Ban className="mx-auto h-9 w-9 text-red-300" /><h1 className="mt-5 text-2xl font-semibold">Couldn’t load this server</h1><p className="mt-2 text-sm text-zinc-400">You may not have permission to manage this server, or the Discord session has expired.</p><Link to="/servers" className="mt-6 inline-flex rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold">Back to servers</Link></div></main>; }
