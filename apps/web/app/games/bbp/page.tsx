'use client';

import { useState } from 'react';

export default function BaseballGamePage() {
  const [showGame, setShowGame] = useState(false);

  return (
    <section>
      <h1>Sandlot Sluggers</h1>
      <p className="text-muted" style={{ marginTop: 12 }}>
        Original BlazeSportsIntel baseball mini-game. Built with Phaser, tuned for mobile, and isolated via iframe for maximum
        performance.
      </p>
      <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
        {!showGame && (
          <button className="button" onClick={() => setShowGame(true)} style={{ justifySelf: 'start' }}>
            Play
          </button>
        )}
        <div style={{ position: 'relative', width: '100%', paddingTop: '177.78%', borderRadius: 24, overflow: 'hidden' }}>
          {showGame ? (
            <iframe
              src="/games/bbp-web/index.html"
              title="Sandlot Sluggers"
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: '0',
              }}
              allow="fullscreen"
            />
          ) : (
            <div
              className="skeleton"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 24,
              }}
            />
          )}
        </div>
        <p style={{ fontSize: 13, color: '#e2e8f0' }}>
          Tip: Use landscape mode for a wider view. Session analytics stream to BlazeSportsIntel dashboards in real time.
        </p>
        <a href="/games/bbp/legal" className="text-muted" style={{ fontSize: 12 }}>
          View legal + asset credits
        </a>
      </div>
    </section>
  );
}
