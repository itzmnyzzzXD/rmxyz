import { createFileRoute } from "@tanstack/react-router";
import { buildAuthorizeUrl, discordConfig, isDiscordConfigured } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

const getRedirectUri = (request: Request) => {
  const configured = process.env["DISCORD_REDIRECT_URI"]?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.origin}/api/auth/discord/callback`;
};

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isDiscordConfigured()) {
          const { clientId, clientSecret } = discordConfig();
          const missing = [...(!clientId ? ["DISCORD_CLIENT_ID"] : []), ...(!clientSecret ? ["DISCORD_CLIENT_SECRET"] : [])];
          return new Response(
            `Discord application credentials are not configured yet. Missing: ${missing.join(", ")}. Add these as server-side environment variables in Vercel.`,
            { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
          );
        }
        const redirectUri = getRedirectUri(request);
        const state = crypto.randomUUID();
        const session = await getRMSession();
        await session.update({ oauthState: state });
        return new Response(null, {
          status: 302,
          headers: { location: buildAuthorizeUrl(redirectUri, state), "cache-control": "no-store" },
        });
      },
    },
  },
});
