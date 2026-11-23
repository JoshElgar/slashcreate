import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.slashcreate.com"),
  title: "/create — Actuators for Defence",
  description: "Actuator assemblies for defence. From drawing and quotation through to inspection and delivery.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    title: "/create — Actuators for Defence",
    description: "Actuator assemblies for defence. From drawing to delivery.",
    url: "/",
    images: [{ url: "/manufacturing/cnc-machining.webp", width: 1920, height: 1080 }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
