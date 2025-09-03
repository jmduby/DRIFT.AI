import TopNav from './components/TopNav';
import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Drift.ai",
  description: "AI-powered invoice reconciliation for nursing homes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className={`${inter.variable} ${roboto.variable} antialiased`}>
  <TopNav />
  <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
</body>
    </html>
  );
}
