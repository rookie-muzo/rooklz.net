import type { Metadata } from "next";
import Link from "next/link";
import NowPlayingTicker from "@/components/NowPlayingTicker";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "rooklz.net",
  description: "Rooklz' retro playground: photos, projects, links, and toys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="taskbar sticky top-0 z-40 border-b border-black/50">
          <div className="mx-auto max-w-5xl px-4">
            <div className="h-12 flex items-center gap-4 text-sm">
              <Link href="/" className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white">Home</Link>
              <Link href="/photos" className="px-2 py-1 rounded hover:bg-white/10">Photos</Link>
              <Link href="/projects" className="px-2 py-1 rounded hover:bg-white/10">Projects</Link>
              <Link href="/links" className="px-2 py-1 rounded hover:bg-white/10">Links</Link>
              <Link href="/playgrounds" className="px-2 py-1 rounded hover:bg-white/10">Playgrounds</Link>
              <div className="ms-auto flex items-center gap-3">
                <NowPlayingTicker />
                <div className="text-xs text-white/60">Rooklz • retro mode</div>
              </div>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
          <div className="window">
            <div className="titlebar px-3 py-2 flex items-center justify-between">
              <div className="font-semibold">rooklz.net</div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-[#3ecf8e]"></span>
                <span className="inline-block h-3 w-3 rounded-full bg-[#ffd000]"></span>
                <span className="inline-block h-3 w-3 rounded-full bg-[#ff6a00]"></span>
              </div>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
