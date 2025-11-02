'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

const links: ReadonlyArray<{ href: Route; label: string }> = [
  { href: '/' as Route, label: 'Home' },
  { href: '/games' as Route, label: 'Games' },
  { href: '/performance' as Route, label: 'Performance' },
  { href: '/contact' as Route, label: 'Contact' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="nav-desktop" aria-label="Primary">
      <div className="brand">BlazeSportsIntel</div>
      <div className="nav-links">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={active ? 'active' : undefined}>
              {link.label}
            </Link>
          );
        })}
        <Link href="/games/bbp" className="button">
          Play Baseball
        </Link>
      </div>
      <style jsx>{`
        .nav-desktop {
          display: none;
        }
        @media (min-width: 960px) {
          .nav-desktop {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }
          .brand {
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }
          .nav-links {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .nav-links a {
            font-size: 14px;
            padding: 10px 0;
            opacity: 0.86;
          }
          .nav-links a.active {
            opacity: 1;
            color: #ffb48a;
          }
          .button {
            padding: 10px 18px;
          }
        }
      `}</style>
    </nav>
  );
}
