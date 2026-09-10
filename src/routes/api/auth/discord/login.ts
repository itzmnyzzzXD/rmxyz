import { createFileRoute } from "@tanstack/react-router";
import { createHmac, randomBytes } from "node:crypto";
import { buildAuthorizeUrl, discordConfig, isDiscordConfigured } from "@/lib/discord.server";

const REDIRECT_URI = "https://rmxyz.vercel.app/api/auth/discord/oauth-callback";

function signState(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function createOAuthState(secret: string) {
  const payload = JSON.stringify({
    nonce: randomBytes(32).toString("base64url"),
    issuedAt: Date.now(),
  });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${signState(encoded, secret)}`;
}

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

        const { clientSecret } = discordConfig();
        if (!clientSecret) {
          return new Response("Discord OAuth secret is not configured.", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
          });
        }

        const state = createOAuthState(clientSecret);
        const location = buildAuthorizeUrl(REDIRECT_URI, state);

        return new Response(null, {
          status: 302,
          headers: {
            location,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
