'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links: ReadonlyArray<{ href: Route; label: string }> = [
  { href: '/' as Route, label: 'Home' },
  { href: '/games' as Route, label: 'Games' },
  { href: '/performance' as Route, label: 'Performance' },
  { href: '/contact' as Route, label: 'Contact' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav">
      <div className="brand">BlazeSportsIntel</div>
      <button
        type="button"
        aria-expanded={open}
        className="menu-toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        Menu
      </button>
      {open && (
        <div className="sheet" role="menu">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} role="menuitem" className={active ? 'active' : undefined}>
                {link.label}
              </Link>
            );
          })}
          <Link href="/games/bbp" className="button" role="menuitem">
            Play Baseball
          </Link>
        </div>
      )}
      <style jsx>{`
        .mobile-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 12px;
        }
        .brand {
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .menu-toggle {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(10, 14, 24, 0.6);
          color: #f8fafc;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 600;
        }
        .sheet {
          position: absolute;
          top: 72px;
          left: 16px;
          right: 16px;
          display: grid;
          gap: 12px;
          padding: 16px;
          background: rgba(9, 12, 22, 0.95);
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 24px 36px rgba(3, 6, 14, 0.55);
        }
        .sheet a {
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
        }
        .sheet a.active {
          background: rgba(255, 107, 53, 0.15);
          color: #ffb48a;
        }
        @media (min-width: 960px) {
          .mobile-nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
