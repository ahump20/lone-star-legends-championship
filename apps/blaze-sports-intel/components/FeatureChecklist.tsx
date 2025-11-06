const checklist = [
  'Touch-first controls with large tap targets and haptic-ready event hooks',
  'Timing-based batting loop tuned for quick three-inning sessions',
  'Dynamic CPU scoring curve to keep championships competitive',
  'Replay tracker and streak bonuses for long-term mastery',
  'Responsive canvas scaling that keeps visuals crisp on phones and tablets',
  'Original soundtrack direction with sandlot crowd ambience (placeholder for future audio drop)',
];

export function FeatureChecklist() {
  return (
    <section className="section" aria-labelledby="feature-checklist">
      <h2 id="feature-checklist">Designed for Nostalgia & Modern Mobile Play</h2>
      <p>
        Backyard Blaze League reimagines classic sandlot baseball for phones without leaning on any
        licensed characters. Every feature aims at production readiness on BlazeSportsIntel.com and
        Cloudflare delivery pipelines.
      </p>
      <ul style={{ marginTop: '1.5rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
        {checklist.map((item) => (
          <li key={item} style={{ marginBottom: '0.75rem' }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
