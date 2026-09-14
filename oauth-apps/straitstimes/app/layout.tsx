import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Straits Times | OAuth client demo",
  description: "A local OAuth client UI styled after The Straits Times.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
