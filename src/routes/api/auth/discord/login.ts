import { createFileRoute } from "@tanstack/react-router";
import { buildAuthorizeUrl, discordConfig, isDiscordConfigured } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";

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
            { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
          );
        }

        const state = crypto.randomUUID();
        const session = await getRMSession();
        await session.update({ oauthState: state });

        return new Response(null, {
          status: 302,
          headers: {
            location: buildAuthorizeUrl(REDIRECT_URI, state),
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
