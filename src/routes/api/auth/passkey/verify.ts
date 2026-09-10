import { createFileRoute } from "@tanstack/react-router";
import { verifyPasskeyAuthentication } from "@/lib/passkey.server";

export const Route = createFileRoute("/api/auth/passkey/verify")({
  server: { handlers: { POST: async ({ request }) => {
    try {
      const body = await request.json() as { response?: unknown; challengeId?: string };
      if (!body.response || !body.challengeId) return Response.json({ error: "missing_fields" }, { status: 400 });
      await verifyPasskeyAuthentication(body.response, body.challengeId);
      return Response.json({ ok: true });
    } catch (error) {
      console.error("passkey authentication failed", error instanceof Error ? error.message : "unknown");
      return Response.json({ error: "PASSKEY_LOGIN_FAILED" }, { status: 401 });
    }
  } } },
});
