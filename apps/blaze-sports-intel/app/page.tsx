import { BackyardLegendsGame } from '../components/game/BackyardLegendsGame';
import { CharacterGrid } from '../components/CharacterGrid';
import { FeatureChecklist } from '../components/FeatureChecklist';
import { StadiumGrid } from '../components/StadiumGrid';

export default function Page() {
  return (
    <main>
      <section className="hero">
        <div>
          <h1 className="hero-title">Backyard Blaze League</h1>
          <p className="hero-subtitle">
            A brand-new, original mobile baseball adventure channeling the spirit of kid-powered
            sandlot showdowns. Optimized for Cloudflare delivery, built with TypeScript + Next.js,
            and ready to anchor BlazeSportsIntel.com with replayable fun.
          </p>
          <button
            type="button"
            className="hero-cta"
            onClick={() => {
              const target = document.getElementById('backyard-blaze-game');
              target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Jump Into the Game
          </button>
        </div>
      </section>
      <BackyardLegendsGame />
      <CharacterGrid />
      <StadiumGrid />
      <FeatureChecklist />
    </main>
  );
}
