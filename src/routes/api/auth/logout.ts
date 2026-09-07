import { createFileRoute } from "@tanstack/react-router";
import { getRMSession } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      GET: async () => {
        const session = await getRMSession();
        await session.clear();
        return new Response(null, { status: 302, headers: { location: "/" } });
      },
    },
  },
});
