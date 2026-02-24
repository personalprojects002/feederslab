import { betterAuth } from "better-auth";
import { magicLink, jwt } from "better-auth/plugins";
import { pool } from "./postgres";

// Safely get and validate environment variables
const googleId = process.env.GOOGLE_ID?.toString()?.trim();
const googleSecret = process.env.GOOGLE_SECRET?.toString()?.trim();
const authSecret = process.env.BETTER_AUTH_SECRET?.toString()?.trim();

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
}

if (!googleId || !googleSecret) {
  throw new Error(
    "Missing Google credentials. Please set GOOGLE_ID and GOOGLE_SECRET in your .env",
  );
}

export const auth = betterAuth({
  appName: "Feeders",
  database: pool,
  secret: authSecret,

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
        const from = process.env.RESEND_FROM || "noreply@email.feeders.app";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: email,
            subject: `Sign in to ${host}`,
            html: html({ url, host }),
            text: text({ url, host }),
          }),
        });

        if (!res.ok) {
          console.error("Resend error", await res.json());
          throw new Error("Failed to send email");
        }
      },
    }),
  ],

  basePath: "/api/better-auth",
});

function html({ url, host }: { url: string; host: string }) {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const color = {
    background: "#000000",
    text: "#ffffff",
    secondaryText: "#a1a1aa",
    buttonBackground: "#ffffff",
    buttonText: "#000000",
    border: "#333333",
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign in to ${escapedHost}</title>
</head>
<body style="margin:0; background:${color.background}; font-family:Arial;">
  <div style="max-width:600px; margin:auto; padding:40px; border:1px solid ${color.border}; border-radius:12px;">
    <h1 style="color:${color.text};">${escapedHost}</h1>
    <p style="color:${color.secondaryText};">Click the button below to sign in.</p>
    <a href="${url}" style="display:inline-block; padding:14px 32px; background:${color.buttonBackground};
      color:${color.buttonText}; text-decoration:none; border-radius:8px;">
      Sign in
    </a>
    <p style="margin-top:24px; color:${color.secondaryText}; font-size:14px;">
      If you didn't request this email, ignore it.
    </p>
    <p style="margin-top:40px; font-size:12px; color:#666;">
      © ${new Date().getFullYear()} ${escapedHost}
    </p>
  </div>
</body>
</html>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}
