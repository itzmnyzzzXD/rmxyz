import { createFileRoute } from "@tanstack/react-router";
import { exchangeCode, fetchCurrentUser } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";

export const Route = createFileRoute("/api/auth/discord/oauth-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const session = await getRMSession();

        if (error) {
          console.error("Discord OAuth rejected authorization", error, url.searchParams.get("error_description"));
          return new Response(null, { status: 302, headers: { location: "/login?error=oauth" } });
        }

        if (!code || !state || state !== session.data.oauthState) {
          return new Response(null, { status: 302, headers: { location: "/login?error=state" } });
        }

        try {
          const token = await exchangeCode(code, REDIRECT_URI);
          const user = await fetchCurrentUser(token.access_token);
          await session.update({
            userId: user.id,
            username: user.username,
            globalName: user.global_name ?? user.username,
            avatar: user.avatar ?? undefined,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresAt: Date.now() + token.expires_in * 1000,
            oauthState: undefined,
          });
          return new Response(null, { status: 302, headers: { location: "/servers", "cache-control": "no-store" } });
        } catch (error) {
          console.error("Discord OAuth callback failed", error);
          return new Response(null, { status: 302, headers: { location: "/login?error=oauth" } });
        }
      },
    },
  },
});
