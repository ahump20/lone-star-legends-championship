export const metadata = {
  title: 'Sandlot Sluggers Legal',
};

export default function GameLegalPage() {
  return (
    <section>
      <h1>Sandlot Sluggers Legal Notice</h1>
      <p className="text-muted" style={{ marginTop: 12 }}>
        Sandlot Sluggers is an original BlazeSportsIntel experience. All characters, environments, UI, and audio are bespoke or
        placeholder assets created for this prototype. No legacy backyard-era baseball franchise names, likenesses, logos, or
        source assets are used.
      </p>
      <ul style={{ marginTop: 20, lineHeight: 1.6 }}>
        <li>Asset provenance is tracked in <a href="/assets/LICENSES.md">assets/LICENSES.md</a>.</li>
        <li>AI prompts and guardrails live in <a href="/docs/ai-assets/prompts-and-guidelines.md">docs/ai-assets/prompts-and-guidelines.md</a>.</li>
        <li>For replacements, update documentation and run `pnpm ci:blocklist` before shipping.</li>
      </ul>
    </section>
  );
}
