import { createFileRoute } from "@tanstack/react-router";
import { createVerifyChallenge } from "@/lib/local-auth.server";
import { requestOrigin } from "@/lib/site.server";



function authorized(request: Request) {
  const configured = process.env["BOT_SYNC_KEY"]?.trim();
  const supplied = request.headers.get("x-bot-key")?.trim();
  if (!configured || !supplied) return false;
  if (configured.length !== supplied.length) return false;
  let diff = 0;
  for (let i = 0; i < configured.length; i++) diff |= configured.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/verify/start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
        try {
          const body = await request.json() as { discord_id?: string; discord_username?: string; guild_id?: string };
          if (!/^\d{15,25}$/.test(body.discord_id ?? "") || !body.guild_id || !/^\d{15,25}$/.test(body.guild_id)) {
            return Response.json({ error: "invalid_request" }, { status: 400 });
          }
          const challenge = await createVerifyChallenge({
            discordId: body.discord_id!,
            discordUsername: String(body.discord_username || "Discord user").slice(0, 100),
            guildId: body.guild_id!,
          });
          return Response.json({ ok: true, url: `${requestOrigin(request)}/verify?challenge=${encodeURIComponent(challenge)}` });
        } catch (error) {
          console.error("verify start failed", error);
          return Response.json({ error: "server_error" }, { status: 500 });
        }
      },
    },
  },
});
