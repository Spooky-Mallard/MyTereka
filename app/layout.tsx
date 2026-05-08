import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MyTereka", template: "%s — MyTereka" },
  description: "Personal finance manager — track budgets, goals and spending.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `(function(){try{var t=localStorage.getItem('fw-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
