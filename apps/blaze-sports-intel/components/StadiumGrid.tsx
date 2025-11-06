import { stadiumProfiles } from '../lib/stadiums';
import type { StadiumProfile } from '../lib/gameTypes';

export function StadiumGrid() {
  return (
    <section className="section" aria-labelledby="stadium-showcase">
      <h2 id="stadium-showcase">Backyard Stadium Circuit</h2>
      <p>
        Rotate through original venues that boost different playstyles. Each sandlot tweaks timing
        windows, wind physics, and CPU scoring odds to keep seasons fresh and replayable.
      </p>
      <div className="card-grid" role="list">
        {stadiumProfiles.map((stadium: StadiumProfile) => (
          <article className="card" key={stadium.id} role="listitem">
            <h3>{stadium.name}</h3>
            <p>{stadium.backdrop}</p>
            <p>
              <strong>Vibe:</strong> {stadium.vibe}
            </p>
            <p>
              <strong>Weather Edge:</strong> {stadium.weatherBias}
            </p>
            <div className="badge-row" aria-label="Tuning modifiers">
              <span className="badge">Timing +{stadium.timingBonus}ms</span>
              <span className="badge">Power +{Math.round(stadium.powerBonus * 100)}%</span>
              <span className="badge">Fan Zone: {stadium.capacity}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
