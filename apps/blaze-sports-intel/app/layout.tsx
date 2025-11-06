import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backyard Blaze League | BlazeSportsIntel',
  description:
    'Original mobile baseball experience built for BlazeSportsIntel.com with nostalgic sandlot energy and production-ready performance.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#12203c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
