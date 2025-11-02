import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { MobileNav } from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'BlazeSportsIntel — Performance Intelligence Platform',
  description:
    'Mobile-first sports intelligence platform combining live telemetry, analytics, and original Sandlot Sluggers mini-game.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <header className="shell-header">
          <Navigation />
          <MobileNav />
        </header>
        <main>{children}</main>
        <Script id="web-vitals" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              import('web-vitals/attribution').then(({ onLCP, onCLS, onINP }) => {
                const handler = (metric) => {
                  window.dispatchEvent(new CustomEvent('web-vitals', { detail: metric }));
                  if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
                  }
                };
                onLCP(handler);
                onCLS(handler);
                onINP(handler);
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
