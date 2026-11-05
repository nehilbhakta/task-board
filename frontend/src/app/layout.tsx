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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="site">
          <Link href="/" className="wordmark" aria-label="TaskBoard home">
            <span className="wordmark-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            TaskBoard
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
