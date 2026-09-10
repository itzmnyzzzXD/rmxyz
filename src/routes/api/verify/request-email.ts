import { createFileRoute } from "@tanstack/react-router";
import { requestSignup } from "@/lib/local-auth.server";
import { sendVerificationEmail } from "@/lib/email.server";

export const Route = createFileRoute("/api/verify/request-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as {
            challengeId?: string;
            email?: string;
            username?: string;
            avatar?: string;
            password?: string;
          };
          if (!body.challengeId || !body.email || !body.username || !body.password) {
            return Response.json({ error: "missing_fields" }, { status: 400 });
          }
          const signup = await requestSignup({
            challengeId: body.challengeId,
            email: body.email,
            username: body.username,
            avatar: body.avatar,
            password: body.password,
          });
          await sendVerificationEmail({ to: signup.email, username: body.username, token: signup.verifyToken });
          return Response.json({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown";
          const code = message.split(":")[0];
          const status = ["EMAIL_IN_USE", "USERNAME_IN_USE", "INVALID_EMAIL", "INVALID_USERNAME", "WEAK_PASSWORD", "VERIFY_LINK_EXPIRED"].includes(code) ? 400 : 503;
          console.error("verify email request failed", code);
          return Response.json({ error: code }, { status });
        }
      },
    },
  },
});
