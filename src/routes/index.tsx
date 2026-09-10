import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getBotStatus } from "@/lib/rm/status.functions";
import { COMMANDS, CATEGORIES } from "@/lib/rm/commands";
import { MODULE_META } from "@/lib/rm/modules";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RM — Discord moderation, security and community bot" },
      { name: "description", content: "RM protects your Discord server with moderation, AutoMod, anti-nuke and anti-raid, all managed from one dashboard." },
      { property: "og:title", content: "RM — Discord security bot" },
      { property: "og:description", content: "Moderation, AutoMod, anti-nuke, anti-raid, tickets, leveling and economy in one bot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: status } = useQuery({ queryKey: ["bot-status"], queryFn: () => getBotStatus(), refetchInterval: 30_000 });
  const online = status?.status === "online";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3"><img src="/bot-icon.png" alt="RM bot icon" width={40} height={40} className="h-10 w-10 rounded-xl" /><span className="text-xl font-semibold tracking-tight">RM</span></div>
        <a href="/login" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">Sign in</a>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="py-16">
          <span className={`inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs ${online ? "text-primary" : "text-muted-foreground"}`}><span className={`h-2 w-2 rounded-full ${online ? "bg-primary" : "bg-muted-foreground"}`} />{online ? "Bot online" : "Bot offline"}{status?.latencyMs != null && online ? ` · ${status.latencyMs}ms` : ""}</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight">One bot to moderate, protect and grow your Discord server.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">RM answers to <code className="text-primary">rm!</code> and <code className="text-primary">rm?</code>, custom prefixes, mentions and slash commands — with anti-nuke, anti-raid and AutoMod running in the background.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="/login" className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Open dashboard</a><a href="/verify" className="rounded-lg border border-border px-5 py-3 text-sm font-medium">Open verification</a><a href="#commands" className="rounded-lg border border-border px-5 py-3 text-sm font-medium">Browse {COMMANDS.length} commands</a></div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
          { label: "Servers", value: status?.guildCount ?? 0 },
          { label: "Members protected", value: status?.userCount ?? 0 },
          { label: "Commands run", value: status?.commandsProcessed ?? 0 },
          { label: "Modules", value: MODULE_META.length },
        ].map((stat) => <div key={stat.label} className="rounded-xl border border-border bg-card p-5"><div className="text-3xl font-semibold">{stat.value.toLocaleString()}</div><div className="mt-1 text-sm text-muted-foreground">{stat.label}</div></div>)}</section>

        <section className="mt-20"><h2 className="text-2xl font-semibold tracking-tight">Everything is configurable</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{MODULE_META.map((m) => <div key={m.key} className="rounded-xl border border-border bg-card p-5"><h3 className="font-medium">{m.label}</h3><p className="mt-2 text-sm text-muted-foreground">{m.description}</p></div>)}</div></section>

        <section id="commands" className="mt-20"><h2 className="text-2xl font-semibold tracking-tight">Commands</h2><div className="mt-6 space-y-6">{CATEGORIES.map((category) => <div key={category}><h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{category}</h3><div className="mt-2 flex flex-wrap gap-2">{COMMANDS.filter((c) => c.category === category).map((c) => <span key={c.name} title={c.description} className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs">{c.name}</span>)}</div></div>)}</div></section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">RM {status?.version ? `v${status.version}` : ""} — self-hosted Discord bot</footer>
    </div>
  );
}
