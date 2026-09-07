import { createFileRoute } from "@tanstack/react-router";
import { exchangeCode, fetchCurrentUser } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const session = await getRMSession();

        if (!code || !state || state !== session.data.oauthState) {
          return new Response(null, {
            status: 302,
            headers: { location: "/login?error=state" },
          });
        }

        try {
          const token = await exchangeCode(code, `${url.origin}/api/auth/discord/callback`);
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
          return new Response(null, { status: 302, headers: { location: "/servers" } });
        } catch (error) {
          console.error("Discord OAuth callback failed", error);
          return new Response(null, {
            status: 302,
            headers: { location: "/login?error=oauth" },
          });
        }
      },
    },
  },
});
