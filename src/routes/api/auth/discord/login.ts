import { createFileRoute } from "@tanstack/react-router";
import { buildAuthorizeUrl, isDiscordConfigured } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/discord/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isDiscordConfigured()) {
          return new Response("Discord application credentials are not configured yet.", {
            status: 503,
          });
        }
        const url = new URL(request.url);
        const redirectUri = `${url.origin}/api/auth/discord/callback`;
        const state = crypto.randomUUID();
        const session = await getRMSession();
        await session.update({ oauthState: state });
        return new Response(null, {
          status: 302,
          headers: { location: buildAuthorizeUrl(redirectUri, state) },
        });
      },
    },
  },
});
