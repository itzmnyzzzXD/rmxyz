import { createFileRoute } from "@tanstack/react-router";
import { exchangeCode, fetchCurrentUser } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";

function getCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const Route = createFileRoute("/api/auth/discord/oauth-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const session = await getRMSession();
        const cookieState = getCookie(request, "rm_oauth_state");
        const expectedState = cookieState ?? session.data.oauthState;

        const redirect = (location: string, clearState = true) => {
          const headers = new Headers({
            location,
            "cache-control": "no-store, no-cache, must-revalidate",
          });
          if (clearState) {
            headers.append(
              "set-cookie",
              "rm_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
            );
          }
          return new Response(null, { status: 302, headers });
        };

        if (error) {
          console.error(
            "Discord OAuth rejected authorization",
            error,
            url.searchParams.get("error_description"),
          );
          return redirect(`/login?error=${encodeURIComponent(error)}`);
        }

        if (!code) {
          return redirect("/login?error=missing_code");
        }

        // Discord returns the state value to the exact redirect URI. Validate it
        // against both the short-lived browser cookie and the server session.
        if (!returnedState || !expectedState || returnedState !== expectedState) {
          console.error("Discord OAuth state validation failed", {
            hasReturnedState: Boolean(returnedState),
            hasCookieState: Boolean(cookieState),
            hasSessionState: Boolean(session.data.oauthState),
          });
          return redirect("/login?error=state");
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

          return redirect("/servers");
        } catch (error) {
          console.error("Discord OAuth callback failed", error);
          return redirect("/login?error=oauth");
        }
      },
    },
  },
});
