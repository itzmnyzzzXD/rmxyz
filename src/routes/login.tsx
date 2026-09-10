import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, LogIn, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — RM" },
      { name: "description", content: "Sign in to manage your Discord servers with RM." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const error = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("error");

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[85vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>

          <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/20">
            <ShieldCheck className="h-7 w-7 text-red-400" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sign in to RM</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Connect your Discord account to see the servers you own or can manage.
          </p>

          {error && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <p className="font-medium">Discord sign-in failed</p>
                <p className="mt-1 text-amber-100/70">
                  {error === "state" ? "The login session expired. Start the Discord login again." : "Discord rejected the sign-in request. Check the OAuth redirect and application credentials."}
                </p>
              </div>
            </div>
          )}

          <a
            href="/api/auth/discord/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" />
            Continue with Discord
          </a>

          <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
            RM only requests your Discord identity and server list. It uses your server permissions to determine which communities you can manage.
          </p>
        </div>
      </div>
    </main>
  );
}
