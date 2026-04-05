import { betterAuth } from "better-auth";
import { magicLink, jwt } from "better-auth/plugins";
import { pool } from "./postgres";

// Fail-fast validation keeps misconfigured deployments from reaching runtime
// routes where errors are harder to diagnose and can leak partial state.
const googleId = process.env.GOOGLE_ID?.toString()?.trim();
const googleSecret = process.env.GOOGLE_SECRET?.toString()?.trim();
const authSecret = process.env.BETTER_AUTH_SECRET?.toString()?.trim();
const resendKey = process.env.RESEND_KEY?.toString()?.trim();
const resendFrom = process.env.RESEND_FROM?.toString()?.trim();
const sessionExpiryRaw =
  process.env.BETTER_AUTH_SESSION_EXPIRY_SECONDS?.toString()?.trim();

const defaultSessionExpirySeconds = 14 * 24 * 60 * 60;
const parsedSessionExpirySeconds = Number.parseInt(
  sessionExpiryRaw || `${defaultSessionExpirySeconds}`,
  10,
);
const resolvedSessionExpirySeconds =
  Number.isFinite(parsedSessionExpirySeconds) && parsedSessionExpirySeconds > 0
    ? parsedSessionExpirySeconds
    : defaultSessionExpirySeconds;

const defaultFrom = "FeedersLab <noreply@email.feeders.app>";
const resolvedFrom = resendFrom?.length ? resendFrom : defaultFrom;

if (!resolvedFrom.includes("@")) {
  throw new Error(
    "RESEND_FROM must be a valid sender address, for example: FeedersLab <noreply@email.feeders.app>",
  );
}

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
}

if (!googleId || !googleSecret) {
  throw new Error(
    "Missing Google credentials. Please set GOOGLE_ID and GOOGLE_SECRET in your .env",
  );
}

if (!resendKey) {
  throw new Error("Missing RESEND_KEY. Please set RESEND_KEY in your .env");
}

// Get the base URL - support dynamic ports
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  // Default to localhost with any port
  return "http://localhost:3000";
};

export const auth = betterAuth({
  appName: "Feeders",
  database: pool,
  secret: authSecret,
  trustHost: true,
  baseURL: getBaseURL(),
  session: {
    expiresIn: resolvedSessionExpirySeconds,
    // We keep explicit refresh boundaries instead of silent extension so
    // backend token rotation stays deterministic across tabs and devices.
    slidingExpiration: false, // Session does NOT extend on activity
  },

  socialProviders: {
    google: {
      clientId: googleId,
      clientSecret: googleSecret,
    },
  },

  plugins: [
    jwt(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { host } = new URL(url);
        const from = resolvedFrom;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [email],
            subject: `Sign in to FeedersLab securely`,
            html: html({ url, host }),
            text: text({ url, host }),
          }),
        });

        if (!res.ok) {
          const errorPayload = await res.text();
          console.error("Resend error", errorPayload);
          throw new Error(
            `Failed to send email (${res.status}). Check RESEND_KEY / RESEND_FROM domain verification.`,
          );
        }
      },
    }),
  ],

  basePath: "/api/better-auth",
});

function html({ url, host }: { url: string; host: string }) {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const escapedUrl = url.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const year = new Date().getFullYear();
  const bodyFont = "'Inter','Segoe UI',Arial,Helvetica,sans-serif";
  const headingFont =
    "'Plus Jakarta Sans','Inter','Segoe UI',Arial,Helvetica,sans-serif";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FeedersLab secure sign in</title>
</head>
<body style="margin:0; padding:0; background:#050505; font-family:${bodyFont}; color:#f5f5f5;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
    Your secure FeedersLab sign-in link is ready.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050505;">
    <tr>
      <td align="center" style="padding:34px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px; border:1px solid #1f1f1f; border-radius:22px; overflow:hidden; background:#0a0a0a;">
          <tr>
            <td style="padding:28px 30px 18px; border-bottom:1px solid #1d1d1d; background:linear-gradient(145deg,#131313 0%,#090909 100%);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size:12px; line-height:1; letter-spacing:0.16em; text-transform:uppercase; color:#8b8b8b; font-weight:600; font-family:${headingFont};">
                    FeedersLab
                  </td>
                  <td align="right" style="font-size:12px; line-height:1; letter-spacing:0.12em; text-transform:uppercase; color:#8b8b8b; font-family:${headingFont};">
                    Secure access
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 30px 18px;">
              <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#9f9f9f; font-weight:600; font-family:${headingFont};">
                One-time sign-in link
              </p>
              <h1 style="margin:0; font-size:32px; line-height:1.22; color:#ffffff; font-weight:700; letter-spacing:-0.02em; font-family:${headingFont};">
                Sign in to your workspace
              </h1>
              <p style="margin:14px 0 0; font-size:15px; line-height:1.7; color:#b7b7b7;">
                Use this private link to sign in to <span style="color:#ffffff; font-weight:600;">${escapedHost}</span>. For your security, only use this email if you requested access.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:10px 30px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:12px; background:#ffffff;">
                    <a href="${escapedUrl}" style="display:inline-block; padding:14px 26px; font-size:14px; line-height:1; font-weight:700; letter-spacing:0.02em; text-decoration:none; color:#070707;">
                      Sign in securely
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 30px 34px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1f1f1f; border-radius:14px; background:#0f0f0f;">
                <tr>
                  <td style="padding:14px 16px; font-size:12px; line-height:1.7; color:#9b9b9b; word-break:break-all;">
                    If the button does not work, copy this URL:<br>
                    <span style="color:#f2f2f2;">${escapedUrl}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0; font-size:12px; line-height:1.7; color:#8a8a8a;">
                If you did not request this, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:14px 0 0; font-size:12px; line-height:1.6; color:#7f7f7f;">
          © ${year} FeedersLab
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `FeedersLab secure sign-in link\n\nUse this one-time sign-in link for ${host}:\n${url}\n\nIf you did not request this, you can ignore this email.\n`;
}
