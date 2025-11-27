import type { Metadata } from "next";
import "./globals.css";
import GlobalPlayer from "@/components/GlobalPlayer";

export const metadata: Metadata = {
  title: "Spotify Album Fetcher",
  description: "Fetch album artwork and details from Spotify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <GlobalPlayer />
      </body>
    </html>
  );
}

