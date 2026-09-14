import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Business Times | OAuth client demo",
  description: "A local OAuth client UI styled after The Business Times.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
