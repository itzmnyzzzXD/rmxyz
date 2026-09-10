import { createFileRoute } from "@tanstack/react-router";
import { getRegistrationOptions } from "@/lib/passkey.server";

export const Route = createFileRoute("/api/auth/passkey/register-options")({
  server: { handlers: { GET: async () => {
    try { return Response.json(await getRegistrationOptions(), { headers: { "cache-control": "no-store" } }); }
    catch (error) { console.error("passkey registration options failed", error instanceof Error ? error.message : "unknown"); return Response.json({ error: "NOT_SIGNED_IN" }, { status: 401 }); }
  } } },
});
