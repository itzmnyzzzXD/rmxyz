import { siteUrl } from "@/lib/site.server";

export async function sendVerificationEmail(input: { to: string; username: string; token: string }) {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const from = process.env["EMAIL_FROM"]?.trim();
  if (!apiKey || !from) throw new Error("EMAIL_NOT_CONFIGURED");

  const link = `${siteUrl()}/api/verify/confirm?token=${encodeURIComponent(input.token)}`;
  const html = `<!doctype html><html><body style="margin:0;background:#09090b;color:#f4f4f5;font-family:Inter,Arial,sans-serif;padding:32px"><div style="max-width:560px;margin:auto;background:#111114;border:1px solid #27272a;border-radius:24px;padding:32px"><div style="font-size:13px;letter-spacing:.18em;color:#a1a1aa;text-transform:uppercase">RM Dashboard</div><h1 style="font-size:30px;margin:12px 0">Verify your account</h1><p style="color:#a1a1aa;line-height:1.6">Hey ${escapeHtml(input.username)}, finish setting up your RM account by verifying this email address.</p><a href="${link}" style="display:inline-block;margin-top:14px;background:#ef4444;color:white;text-decoration:none;padding:14px 20px;border-radius:14px;font-weight:700">Verify email</a><p style="color:#71717a;font-size:12px;line-height:1.6;margin-top:24px">This link expires in 30 minutes. If you didn't start this signup, you can ignore this email.</p></div></body></html>`;
  const text = `Verify your RM account: ${link}\n\nThis link expires in 30 minutes.`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: "Verify your RM Dashboard account", html, text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`EMAIL_SEND_FAILED:${res.status}:${detail.slice(0, 200)}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
