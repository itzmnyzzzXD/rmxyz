import { createFileRoute } from "@tanstack/react-router";
import { getAuthenticationOptions } from "@/lib/passkey.server";

export const Route = createFileRoute("/api/auth/passkey/options")({
  server: { handlers: { GET: async () => {
    try { return Response.json(await getAuthenticationOptions(), { headers: { "cache-control": "no-store" } }); }
    catch (error) { console.error("passkey auth options failed", error instanceof Error ? error.message : "unknown"); return Response.json({ error: "PASSKEY_UNAVAILABLE" }, { status: 503 }); }
  } } },
});
