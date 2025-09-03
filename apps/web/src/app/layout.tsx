import TopNav from './components/TopNav';
import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import { uiPolishPhase2 } from '@/lib/flags';
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
  const isPhase2 = uiPolishPhase2();
  
  return (
    <html lang="en">
      <body 
        className={`${inter.variable} ${roboto.variable} antialiased min-h-screen`}
        style={{
          backgroundColor: isPhase2 ? 'rgb(var(--phase2-bg-0))' : 'var(--background-app)',
          color: isPhase2 ? 'rgb(var(--phase2-fg-0))' : 'var(--text-primary)'
        }}
      >
        {/* Phase 2: Refined gradient system */}
        {isPhase2 && <div className="drift-gradient" aria-hidden />}
        
        {/* Phase 1: Legacy gradient system */}
        {!isPhase2 && <div className="fixed inset-0 bg-grad-hero" aria-hidden />}
        
        <div className="relative z-10">
          <TopNav />
          <main className="mx-auto max-w-[1320px] px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
