import { createFileRoute } from "@tanstack/react-router";
import { buildAuthorizeUrl, discordConfig, isDiscordConfigured } from "@/lib/discord.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";
const STATE_COOKIE = "__Host-rm_oauth_state";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async () => {
        if (!isDiscordConfigured()) {
          const { clientId, clientSecret } = discordConfig();
          const missing = [
            ...(!clientId ? ["DISCORD_CLIENT_ID"] : []),
            ...(!clientSecret ? ["DISCORD_CLIENT_SECRET"] : []),
          ];
          return new Response(
            `Discord application credentials are not configured yet. Missing: ${missing.join(", ")}. Add these as server-side environment variables in Vercel.`,
            { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } },
          );
        }

        const state = crypto.randomUUID();
        const location = buildAuthorizeUrl(REDIRECT_URI, state);
        const cookie = [
          `${STATE_COOKIE}=${encodeURIComponent(state)}`,
          "Path=/",
          "Max-Age=600",
          "HttpOnly",
          "Secure",
          "SameSite=Lax",
        ].join("; ");

        return new Response(null, {
          status: 302,
          headers: {
            location,
            "set-cookie": cookie,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
