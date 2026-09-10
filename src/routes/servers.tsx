import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSessionUser, listManageableGuilds } from "@/lib/rm/dashboard.functions";
import { ArrowRight, Bot, LogOut, Plus, Search, Server, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/servers")({
  head: () => ({ meta: [{ title: "Your servers — RM" }] }),
  component: ServersPage,
});

function ServersPage() {
  const user = useQuery({ queryKey: ["session-user"], queryFn: getSessionUser });
  const guilds = useQuery({
    queryKey: ["manageable-guilds"],
    queryFn: listManageableGuilds,
    retry: 1,
  });
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (guilds.data ?? []).filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [guilds.data, search]);

  if (user.isLoading || guilds.isLoading) {
    return <Loading />;
  }

  if (!user.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-5 text-2xl font-semibold">Sign in first</h1>
          <p className="mt-2 text-sm text-zinc-400">Your Discord session is not active.</p>
          <a href="/api/auth/discord/login" className="mt-6 inline-flex rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold">Sign in with Discord</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#09090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/bot-icon.png" alt="RM" className="h-10 w-10 rounded-xl" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">RM Dashboard</p>
              <p className="truncate text-xs text-zinc-500">Choose a server to manage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex">
              <img src={user.data.avatar} alt="" className="h-6 w-6 rounded-full" />
              <span className="max-w-32 truncate text-sm text-zinc-300">{user.data.name}</span>
            </div>
            <a href="/api/auth/logout" aria-label="Log out" className="rounded-xl border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white">
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-red-400">Welcome back</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Your Discord servers</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Servers where your Discord account has owner, Administrator, or Manage Server permissions are shown here.</p>
          </div>
          <div className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <Search className="h-4 w-4 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search servers..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
          </div>
        </div>

        {guilds.error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
            <p className="font-medium">Couldn’t load your servers</p>
            <p className="mt-1 text-sm text-zinc-400">Your Discord session may have expired. Sign in again to refresh your access.</p>
            <a href="/api/auth/discord/login" className="mt-4 inline-flex rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold">Reconnect Discord</a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <Server className="mx-auto h-10 w-10 text-zinc-700" />
            <p className="mt-4 font-medium">No matching servers</p>
            <p className="mt-1 text-sm text-zinc-500">Try another search, or make sure your Discord account can manage a server.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((guild) => (
              <Link
                key={guild.id}
                to="/dashboard/$guildId"
                params={{ guildId: guild.id }}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-white/[0.055]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {guild.icon ? <img src={guild.icon} alt="" className="h-14 w-14 rounded-2xl border border-white/10 object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5"><Server className="h-6 w-6 text-zinc-500" /></div>}
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{guild.name}</h2>
                      <p className="mt-1 text-xs text-zinc-500">{guild.memberCount.toLocaleString()} members known</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-red-400" />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className={`h-2 w-2 rounded-full ${guild.botPresent ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    {guild.botPresent ? "RM connected" : "RM not connected"}
                  </span>
                  {!guild.botPresent && <span className="inline-flex items-center gap-1 text-xs text-red-400"><Plus className="h-3.5 w-3.5" /> Add bot</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Loading() {
  return <main className="min-h-screen bg-[#09090b] px-4 py-10"><div className="mx-auto max-w-7xl"><div className="h-9 w-56 animate-pulse rounded-xl bg-white/5" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]" />)}</div></div></main>;
}
