import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-body" });
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  variable: "--font-head",
});

export const metadata: Metadata = {
  title: "Lifera Xlorella — Sales Dashboard",
  description: "Sales dashboard for Lifera Xlorella: ads, leads, orders and stock.",
};

// ставим тему до отрисовки, чтобы не было вспышки светлой/тёмной
const themeScript = `
try {
  var t = localStorage.getItem('xl-theme');
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
} catch (e) { document.documentElement.dataset.theme = 'dark'; }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${montserrat.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
