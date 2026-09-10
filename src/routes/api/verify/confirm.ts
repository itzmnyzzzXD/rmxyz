import { createFileRoute } from "@tanstack/react-router";
import { confirmSignup, signInLocal } from "@/lib/local-auth.server";

const page = (title: string, message: string, action?: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · RM</title><style>body{margin:0;background:#07070a;color:#f4f4f5;font-family:Inter,system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:520px;width:100%;background:linear-gradient(180deg,#15151a,#0e0e12);border:1px solid #292931;border-radius:28px;padding:34px;box-shadow:0 30px 100px #0008}.eyebrow{font-size:11px;letter-spacing:.2em;color:#71717a;text-transform:uppercase}.dot{width:48px;height:48px;border-radius:16px;background:#ef444422;color:#ef4444;display:grid;place-items:center;font-size:24px;margin-bottom:18px}h1{font-size:30px;margin:0 0 10px}p{color:#a1a1aa;line-height:1.7}.btn{display:inline-block;margin-top:12px;padding:13px 18px;border-radius:14px;background:#ef4444;color:white;text-decoration:none;font-weight:700}</style></head><body><main class="card"><div class="eyebrow">RM Dashboard</div><div class="dot">✓</div><h1>${title}</h1><p>${message}</p>${action ? `<a class="btn" href="/dashboard">${action}</a>` : ""}</main></body></html>`;

export const Route = createFileRoute("/api/verify/confirm")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token")?.trim();
        if (!token) return new Response(page("Missing verification link", "This verification link is incomplete."), { status: 400, headers: { "content-type": "text/html; charset=utf-8" } });
        try {
          const user = await confirmSignup(token);
          await signInLocal(user);
          return new Response(page("Email verified", "Your RM account is ready. You are signed in. Nothing is redirecting you away from this page — open the dashboard whenever you’re ready.", "Open dashboard"), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
        } catch (error) {
          console.error("verify confirmation failed", error instanceof Error ? error.message : "unknown");
          return new Response(page("Verification link expired", "That email link is invalid or has expired. Start verification again from Discord."), { status: 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
        }
      },
    },
  },
});
