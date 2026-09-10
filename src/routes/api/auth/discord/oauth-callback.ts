import { createFileRoute } from "@tanstack/react-router";
import { exchangeCode, fetchCurrentUser } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";
const STATE_COOKIE = "__Host-rm_oauth_state";

function getCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function redirect(location: string, clearState = true) {
  const headers = new Headers({
    location,
    "cache-control": "no-store, no-cache, must-revalidate",
  });
  if (clearState) {
    headers.append(
      "set-cookie",
      `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    );
  }
  return new Response(null, { status: 302, headers });
}

export const Route = createFileRoute("/api/auth/discord/oauth-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const cookieState = getCookie(request, STATE_COOKIE);

        if (error) {
          console.error(
            "Discord OAuth rejected authorization",
            error,
            url.searchParams.get("error_description"),
          );
          return redirect(`/login?error=${encodeURIComponent(error)}`);
        }

        if (!code) return redirect("/login?error=missing_code");

        if (!returnedState || !cookieState || returnedState !== cookieState) {
          console.error("Discord OAuth state validation failed", {
            hasReturnedState: Boolean(returnedState),
            hasCookieState: Boolean(cookieState),
          });
          return redirect("/login?error=state");
        }

        try {
          const token = await exchangeCode(code, REDIRECT_URI);
          const user = await fetchCurrentUser(token.access_token);
          const session = await getRMSession();

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

          return redirect("/servers");
        } catch (error) {
          console.error("Discord OAuth callback failed", error);
          return redirect("/login?error=oauth");
        }
      },
    },
  },
});
