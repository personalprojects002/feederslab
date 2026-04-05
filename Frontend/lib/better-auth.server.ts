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
const serverBaseUrlRaw = process.env.BETTER_AUTH_URL?.toString()?.trim();
const publicBaseUrlRaw =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.toString()?.trim();
const vercelUrlRaw = process.env.VERCEL_URL?.toString()?.trim();
const vercelProductionUrlRaw =
  process.env.VERCEL_PROJECT_PRODUCTION_URL?.toString()?.trim();
const manualTrustedOriginsRaw =
  process.env.BETTER_AUTH_TRUSTED_ORIGINS?.toString()?.trim();

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
  if (serverBaseUrlRaw) {
    return serverBaseUrlRaw;
  }
  if (publicBaseUrlRaw) {
    return publicBaseUrlRaw;
  }
  if (vercelUrlRaw) {
    // Vercel provides this per-deployment host; using it avoids localhost
    // fallback in cloud environments where explicit base URLs were not set.
    return `https://${vercelUrlRaw}`;
  }
  // Default to localhost with any port
  return "http://localhost:3000";
};

const normalizeOrigin = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
};

const buildTrustedOrigins = (): string[] => {
  const baseCandidates = [
    serverBaseUrlRaw,
    publicBaseUrlRaw,
    vercelUrlRaw,
    vercelProductionUrlRaw,
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  const manualCandidates = (manualTrustedOriginsRaw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allCandidates = [...baseCandidates, ...manualCandidates];
  const normalized = allCandidates
    .map((item) => normalizeOrigin(item))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized));
};

const trustedOrigins = buildTrustedOrigins();

export const auth = betterAuth({
  appName: "Feeders",
  database: pool,
  secret: authSecret,
  trustHost: true,
  baseURL: getBaseURL(),
  // Better Auth rejects non-trusted origins by default; adding deployment and
  // preview hosts prevents valid sign-in attempts from being treated as forged.
  trustedOrigins,
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
            subject: `Your FeedersLab sign-in link`,
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
  const font = "'Inter','Segoe UI',Arial,Helvetica,sans-serif";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your FeedersLab sign-in link</title>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family:${font}; color:#111827;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
    Use this link to sign in to FeedersLab.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; background:#ffffff;">
          <tr>
            <td style="padding:22px 24px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
              FeedersLab
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px; font-size:22px; line-height:1.35; color:#111827; font-weight:700;">
                Sign in to FeedersLab
              </h1>
              <p style="margin:0; font-size:15px; line-height:1.65; color:#374151;">
                Click the button below to sign in to <strong>${escapedHost}</strong>. This is a one-time sign-in link created for your email address.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:10px; background:#111827;">
                    <a href="${escapedUrl}" style="display:inline-block; padding:12px 20px; font-size:14px; line-height:1; font-weight:600; text-decoration:none; color:#ffffff;">
                      Sign in to FeedersLab
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb;">
                <tr>
                  <td style="padding:12px 14px; font-size:12px; line-height:1.7; color:#4b5563; word-break:break-all;">
                    If the button does not work, copy and paste this link into your browser:<br>
                    <span style="color:#111827;">${escapedUrl}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0; font-size:12px; line-height:1.7; color:#6b7280;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:12px 0 0; font-size:12px; line-height:1.6; color:#6b7280;">
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
  return `FeedersLab sign-in link

Sign in to ${host} using this one-time link:
${url}

If you did not request this email, you can safely ignore it.
`;
}
