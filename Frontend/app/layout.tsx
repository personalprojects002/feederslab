import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  // Site-wide title and description
  title: {
    default: "Feeder",
    template: "%s | Feeder",
  },
  description:
    "Feeder — collect customer feedback, prioritize features, and build better products.",
  applicationName: "Feeder",
  metadataBase: new URL("https://example.com"), // Remember to change this when you go live
  openGraph: {
    title: "Feeder",
    description:
      "Collect customer feedback, prioritize features, and build better products.",
    url: "https://example.com",
    siteName: "Feeder",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feeder",
    description:
      "Collect customer feedback, prioritize features, and build better products.",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" className="scroll-smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
