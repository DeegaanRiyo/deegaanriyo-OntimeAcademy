// ─── Resend email helpers ──────────────────────────────────────────────────────
// All outbound emails go through here.
// From address: onboarding@resend.dev works in sandbox.
// Change to a verified domain address before going to production.

import { Resend } from "resend";

// Lazy-initialize so the constructor doesn't throw at build time when the
// env var hasn't been set yet (Vercel injects it at runtime, not build time).
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM    = "Ontime Academy & Co-working Space <no-reply@ontimecws.co.ke>";
const WA_NUM  = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254746628668";
const WA_LINK = `https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to renew my Ontime CWS membership.")}`;

// ── Shared HTML wrapper ────────────────────────────────────────────────────────
function wrap(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#060d0e;font-family:'Helvetica Neue',Arial,sans-serif;color:#e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060d0e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0b1617;border:1px solid #1a2e30;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a7c82,#0fb3bb);padding:28px 32px;">
              <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px;">
                Ontime<span style="color:#f0f0f0;font-weight:300;"> Academy</span>
              </div>
              <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px;">
                Academy &amp; Co-working Space &middot; Nairobi
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1a2e30;font-size:11px;color:#4a6060;">
              Ontime Academy &amp; Co-working Space · Nairobi, Kenya<br />
              You are receiving this because you are an active member.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── 5-day reminder ─────────────────────────────────────────────────────────────
export async function sendFiveDayReminder(to: string, name: string, expiryDate: string) {
  const html = wrap(`
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 20px;">Hi <strong style="color:#fff;">${name}</strong>,</p>
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 24px;line-height:1.6;">
      Your <strong style="color:#0fb3bb;">Ontime membership</strong> expires in
      <strong style="color:#f0b832;">5 days</strong> on
      <strong style="color:#fff;">${expiryDate}</strong>.
    </p>
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 28px;line-height:1.6;">
      Renew now to keep your access to the space, community, and all member benefits without interruption.
    </p>
    <a href="${WA_LINK}"
       style="display:inline-block;background:linear-gradient(135deg,#0a7c82,#0fb3bb);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:600;font-size:14px;">
      Renew on WhatsApp
    </a>
    <p style="font-size:12px;color:#4a6060;margin:24px 0 0;">
      Questions? Reply to this email or message us on WhatsApp.
    </p>
  `);

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `Your Ontime membership expires in 5 days`,
    html,
  });
}

// ── 1-day reminder ─────────────────────────────────────────────────────────────
export async function sendOneDayReminder(to: string, name: string, expiryDate: string) {
  const html = wrap(`
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 20px;">Hi <strong style="color:#fff;">${name}</strong>,</p>
    <div style="background:rgba(240,184,50,.1);border:1px solid rgba(240,184,50,.3);border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#f0b832;font-weight:600;">
        ⚠️ Your membership expires tomorrow — ${expiryDate}
      </p>
    </div>
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 24px;line-height:1.6;">
      This is your final reminder. Renew today to avoid losing access to your
      <strong style="color:#0fb3bb;">Ontime Academy &amp; Co-working Space</strong>.
    </p>
    <a href="${WA_LINK}"
       style="display:inline-block;background:linear-gradient(135deg,#0a7c82,#0fb3bb);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:600;font-size:14px;">
      Renew Now on WhatsApp
    </a>
    <p style="font-size:12px;color:#4a6060;margin:24px 0 0;">
      After expiry your membership access will be automatically suspended.
    </p>
  `);

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `⚠️ Your Ontime membership expires tomorrow`,
    html,
  });
}

// ── Expiry / deactivation notice ───────────────────────────────────────────────
export async function sendExpiredNotice(to: string, name: string) {
  const html = wrap(`
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 20px;">Hi <strong style="color:#fff;">${name}</strong>,</p>
    <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;color:#ef4444;font-weight:600;">
        Your Ontime Academy &amp; Co-working Space membership has expired.
      </p>
    </div>
    <p style="font-size:15px;color:#b0c0c0;margin:0 0 24px;line-height:1.6;">
      Your membership access has been suspended. Contact us on WhatsApp to renew and restore
      your access instantly.
    </p>
    <a href="${WA_LINK}"
       style="display:inline-block;background:linear-gradient(135deg,#0a7c82,#0fb3bb);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:600;font-size:14px;">
      Renew on WhatsApp
    </a>
  `);

  return getResend().emails.send({
    from:    FROM,
    to,
    subject: `Your Ontime membership has expired`,
    html,
  });
}
