import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { exchangeCode, fetchCurrentUser, discordConfig } from "@/lib/discord.server";
import { getRMSession } from "@/lib/session.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      location,
      "cache-control": "no-store, no-cache, must-revalidate",
    },
  });
}

function verifyState(state: string, secret: string) {
  const separator = state.lastIndexOf(".");
  if (separator <= 0 || separator === state.length - 1) return false;

  const encoded = state.slice(0, separator);
  const suppliedSignature = state.slice(separator + 1);
  const expectedSignature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  const a = Buffer.from(suppliedSignature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return false;

  let valid = timingSafeEqual(a, b);
  if (!valid) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      nonce?: string;
      issuedAt?: number;
    };
    if (!payload.nonce || typeof payload.issuedAt !== "number") return false;

    const age = Date.now() - payload.issuedAt;
    valid = age >= -60_000 && age <= 10 * 60_000;
    return valid;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/auth/discord/oauth-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          console.error(
            "Discord OAuth rejected authorization",
            error,
            url.searchParams.get("error_description"),
          );
          return redirect(`/login?error=${encodeURIComponent(error)}`);
        }

        if (!code) return redirect("/login?error=missing_code");

        const { clientSecret } = discordConfig();
        if (!clientSecret) {
          console.error("DISCORD_CLIENT_SECRET is not configured");
          return redirect("/login?error=oauth_config");
        }

        if (!returnedState) {
          console.error("Discord OAuth callback did not include state");
          return redirect("/login?error=state");
        }

        if (!verifyState(returnedState, clientSecret)) {
          console.error("Discord OAuth signed state validation failed");
          return redirect("/login?error=state");
        }

        if (!process.env["SESSION_SECRET"]) {
          console.error("SESSION_SECRET is not configured on the dashboard");
          return redirect("/login?error=session_config");
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
