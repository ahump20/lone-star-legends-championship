import { sluggerProfiles } from '../lib/characters';
import type { SluggerProfile } from '../lib/gameTypes';

export function CharacterGrid() {
  return (
    <section className="section" aria-labelledby="character-showcase">
      <h2 id="character-showcase">Meet the Blaze Sandlot Crew</h2>
      <p>
        Every athlete in Backyard Blaze League is an original kid legend with their own talent arc,
        hometown rituals, and personality-driven boosts. Draft one before each game to shape your
        timing window and scoring potential.
      </p>
      <div className="card-grid" role="list">
        {sluggerProfiles.map((slugger: SluggerProfile) => (
          <article className="card" key={slugger.id} role="listitem">
            <h3>
              {slugger.featuredEmoji} {slugger.name} <span>“{slugger.nickname}”</span>
            </h3>
            <p>{slugger.description}</p>
            <p>
              <strong>Signature:</strong> {slugger.signatureMove}
            </p>
            <div className="badge-row" aria-label="Skill ratings">
              <span className="badge">Power: {slugger.power}/5</span>
              <span className="badge">Contact: {slugger.contact}/5</span>
              <span className="badge">Confidence: {slugger.confidence}/5</span>
            </div>
            <p className="badge" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Hometown: {slugger.hometown} • Bats {slugger.battingStyle}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
