import { betterAuth } from "better-auth";
import { magicLink, jwt } from "better-auth/plugins";
import { pool } from "./postgres";

// Safely get and validate environment variables
const googleId = process.env.GOOGLE_ID?.toString()?.trim();
const googleSecret = process.env.GOOGLE_SECRET?.toString()?.trim();
const authSecret = process.env.BETTER_AUTH_SECRET?.toString()?.trim();
const resendKey = process.env.RESEND_KEY?.toString()?.trim();
const resendFrom = process.env.RESEND_FROM?.toString()?.trim();

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
    expiresIn: 120, // 2 minutes for demo (will change to 900 seconds = 15 minutes later)
    slidingExpiration: false, // Session does NOT extend on activity - will expire after 2 minutes
  },

  socialProviders: {
    google: {
      clientId: googleId,
      clientSecret: googleSecret,
    },
  },

  plugins: [
    jwt({
      expiresIn: "2m", // 2 minutes for demo (will change to 15 minutes later)
    }),
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
            subject: `Your secure sign-in link for ${host}`,
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
  const color = {
    background: "#f5f5f7",
    text: "#0b0b0c",
    secondaryText: "#4b5563",
    buttonBackground: "#0b0b0c",
    buttonText: "#ffffff",
    border: "#e5e7eb",
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign in to ${escapedHost}</title>
</head>
<body style="margin:0; background:${color.background}; font-family:Helvetica, Arial, sans-serif;">
  <div style="max-width:620px; margin:0 auto; padding:48px 24px;">
    <div style="background:#ffffff; border:1px solid ${color.border}; border-radius:16px; padding:36px;">
      <p style="margin:0 0 12px; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:${color.secondaryText};">
        Secure sign-in
      </p>
      <h1 style="margin:0 0 12px; font-size:26px; line-height:1.3; color:${color.text};">
        Your sign-in link for ${escapedHost}
      </h1>
      <p style="margin:0 0 24px; color:${color.secondaryText}; font-size:15px; line-height:1.6;">
        This link is private and meant only for you. If you did not request it, you can ignore this email.
      </p>
      <a href="${url}" style="display:inline-block; padding:14px 28px; background:${color.buttonBackground};
        color:${color.buttonText}; text-decoration:none; border-radius:10px; font-weight:600; font-size:14px;">
        Sign in securely
      </a>
      <p style="margin-top:24px; color:${color.secondaryText}; font-size:13px; line-height:1.6;">
        If the button does not work, copy and paste this link into your browser:
        <br />
        <span style="color:${color.text};">${url}</span>
      </p>
    </div>
    <p style="margin:18px 0 0; text-align:center; font-size:12px; color:${color.secondaryText};">
      © ${new Date().getFullYear()} ${escapedHost}
    </p>
  </div>
</body>
</html>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Your secure sign-in link for ${host}\n${url}\n\nIf you did not request this, you can ignore this email.\n`;
}
