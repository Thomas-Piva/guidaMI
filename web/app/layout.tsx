import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./mockup.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Milano Evolution",
  description: "Your guide to Milan: tell it what you need, get the steps in order and the forms filled in.",
  appleWebApp: { capable: true, title: "Milano Evolution", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

// App shell: on phones the screen fills 100dvh; from 700px it sits in the mockup's .phone frame.
// Screens render their parts (.bar, .body, .dock, .foot) directly inside .scr, which is a flex column.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="phone">
          <div className="scr">
            <div className="status" aria-hidden="true">
              <span>9:41</span>
              <span>●●●</span>
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
