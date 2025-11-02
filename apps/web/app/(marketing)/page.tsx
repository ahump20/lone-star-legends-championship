"use client";

import nextDynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';

export const dynamic = 'force-dynamic';

const LeiDashboard = nextDynamic(() => import('../../components/lei/LeiDashboard'), {
  ssr: false,
  loading: () => <Skeleton height={220} />,
});

const TrajectoryChart = nextDynamic(() => import('../../components/charts/Trajectory'), {
  ssr: false,
  loading: () => <Skeleton height={180} />,
});

const GameSessionAnalytics = nextDynamic(() => import('../../components/GameSessionAnalytics'), {
  ssr: false,
  loading: () => <Skeleton height={160} />,
});

export default function HomePage() {
  return (
    <>
      <section>
        <div style={{ display: 'grid', gap: 32 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <p className="pill">Edge-first analytics • Mobile tuned</p>
            <h1 style={{ fontSize: 'clamp(32px, 9vw, 60px)', lineHeight: 1.05 }}>
              BlazeSportsIntel brings pro-grade intelligence to every screen.
            </h1>
            <p className="text-muted" style={{ fontSize: 16 }}>
              Optimize decision-making with live telemetry, explainable AI, and our original Sandlot Sluggers mini-game designed
              for kid-friendly activations.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/games/bbp" className="button">
                Play Sandlot Sluggers
              </Link>
              <Link href="/performance" className="button" style={{ background: 'rgba(255,255,255,0.06)', color: '#f8fafc' }}>
                View Performance Budgets
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden' }}>
            <Image
              src="/images/hero-field.svg"
              alt="Abstract baseball field visualization"
              priority
              sizes="(max-width: 768px) 100vw, 960px"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </section>
      <section>
        <h2>Lightweight on mobile, powerful on desktop</h2>
        <div className="card-grid">
          <LeiDashboard />
          <TrajectoryChart />
          <GameSessionAnalytics />
        </div>
      </section>
    </>
  );
}
