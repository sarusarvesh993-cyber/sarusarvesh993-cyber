import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Study Desk · UPSC CSE", template: "%s · Study Desk" },
  description: "A private, source-aware study desk for UPSC Civil Services Examination preparation.",
  robots: { index: false, follow: false, nocache: true },
  applicationName: "UPSC Study Desk",
};

export const viewport: Viewport = {
  themeColor: "#f3f4f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
