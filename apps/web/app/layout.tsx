import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { MobileNav } from '@/components/MobileNav';
import { WebVitals } from '@/components/WebVitals';

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
        <WebVitals />
      </body>
    </html>
  );
}
