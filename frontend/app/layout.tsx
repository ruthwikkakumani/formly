import type { Metadata } from "next";
import { ReactNode } from "react";
import Script from "next/script";

import "./globals.css";
import "@/styles/dashboard.css";
import "@/styles/builder.css";
import "@/styles/results.css";
import "@/styles/settings.css";
import "@/styles/respondent.css";

export const metadata: Metadata = {
  title: "Formly — forms that feel like a conversation",
  description: "Typeform-inspired form builder and conversational respondent flow",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script src="/runtime-config.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
