import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { DevQualityToggle } from "@/components/DevQualityToggle";

export const metadata: Metadata = {
  title: "New project",
  description:
    "A minimal starter kit with Next.js, Tailwind CSS, shadcn/ui, and tRPC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <DevQualityToggle />
        </Providers>
      </body>
    </html>
  );
}
