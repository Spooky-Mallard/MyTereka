import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";

export const metadata: Metadata = {
  title: { default: "MyTereka", template: "%s — MyTereka" },
  description: "Gamified financial management for Ugandan youth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /* Dark mode default. Key: mt-theme. No flash on load. */
  const themeScript = `(function(){try{var t=localStorage.getItem('mt-theme');document.documentElement.setAttribute('data-theme',t||'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
