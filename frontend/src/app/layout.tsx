import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata = {
  title: "TaskBoard",
  description: "Boards, lists, and cards — drag a card to move it.",
  icons: { icon: "/icon.svg" },
};

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 32 32" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="tb-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#tb-logo-grad)" />
      <rect x="7" y="7" width="18" height="18" rx="3" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.85" />
      <line x1="13" y1="7" x2="13" y2="25" stroke="#ffffff" strokeWidth="1.4" opacity="0.55" />
      <line x1="19" y1="7" x2="19" y2="25" stroke="#ffffff" strokeWidth="1.4" opacity="0.55" />
      <path d="M11 16.5 L14.5 20 L22 12" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="site">
          <div className="site-bar">
            <Link href="/" className="wordmark" aria-label="TaskBoard home">
              <LogoMark />
              TaskBoard
            </Link>
            <nav className="site-nav" aria-label="Main">
              <Link href="/" className="nav-pill active" aria-current="page">
                Boards
              </Link>
            </nav>
            <Link href="/#create-board" className="new-board-btn">
              ＋ New board
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
