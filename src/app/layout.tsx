import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { DevQualityToggle } from "@/components/DevQualityToggle";
import { MusicToggle } from "@/components/MusicToggle";

export const metadata: Metadata = {
  title: "/Create - create custom books",
  description: "Create a custom book.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/BLMelody-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Geist-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>
          {children}
          <DevQualityToggle />
          <MusicToggle />
        </Providers>
      </body>
    </html>
  );
}
