import { createFileRoute } from "@tanstack/react-router";
import { loginLocal, signInLocal } from "@/lib/local-auth.server";

export const Route = createFileRoute("/api/auth/local-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { email?: string; password?: string };
          if (!body.email || !body.password) return Response.json({ error: "missing_fields" }, { status: 400 });
          const user = await loginLocal(body.email, body.password);
          if (!user) return Response.json({ error: "invalid_credentials" }, { status: 401 });
          await signInLocal(user);
          return Response.json({ ok: true });
        } catch (error) {
          console.error("local login failed", error instanceof Error ? error.message : "unknown");
          return Response.json({ error: "server_error" }, { status: 503 });
        }
      },
    },
  },
});
