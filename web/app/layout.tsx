import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./mockup.css";
import "./globals.css";

// Same face and weights as the approved mockup (design/mockups/index.html loads Open Sans 400/600/700).
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-open-sans" });

export const metadata: Metadata = {
  title: "GuidaMI",
  description: "Your guide to Milan: tell it what you need, get the steps in order and the forms filled in.",
  appleWebApp: { capable: true, title: "GuidaMI", statusBarStyle: "default" },
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
    <html lang="en" className={openSans.variable}>
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
