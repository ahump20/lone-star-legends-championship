import Link from 'next/link';
import Image from 'next/image';

export default function GamesPage() {
  return (
    <section>
      <h1>Games</h1>
      <p className="text-muted" style={{ marginTop: 12 }}>
        Discover BlazeSportsIntel originals. Launch Sandlot Sluggers below — inspired by neighborhood pickup games with entirely
        new characters and art.
      </p>
      <div className="card-grid" style={{ marginTop: 24 }}>
        <article className="card" style={{ display: 'grid', gap: 16 }}>
          <Image src="/images/hero-field.svg" alt="Stylized baseball field" width={640} height={360} />
          <div>
            <h2>Sandlot Sluggers (Web)</h2>
            <p className="text-muted">
              Mobile-ready batting challenge featuring original characters, a three-inning loop, and live analytics streaming into
              BlazeSportsIntel dashboards.
            </p>
          </div>
          <Link href="/games/bbp" className="button">
            Launch Game
          </Link>
        </article>
      </div>
    </section>
  );
}
