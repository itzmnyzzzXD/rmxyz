import { createFileRoute } from "@tanstack/react-router";
import { verifyPasskeyRegistration } from "@/lib/passkey.server";

export const Route = createFileRoute("/api/auth/passkey/register-verify")({
  server: { handlers: { POST: async ({ request }) => {
    try {
      const body = await request.json() as { response?: unknown; name?: string };
      if (!body.response) return Response.json({ error: "missing_response" }, { status: 400 });
      await verifyPasskeyRegistration(body.response, body.name || "This device");
      return Response.json({ ok: true });
    } catch (error) {
      console.error("passkey registration failed", error instanceof Error ? error.message : "unknown");
      return Response.json({ error: "PASSKEY_REGISTRATION_FAILED" }, { status: 400 });
    }
  } } },
});
