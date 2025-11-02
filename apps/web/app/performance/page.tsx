const budgets = [
  { metric: 'LCP', target: '≤ 2.5s', context: 'Home, games landing, baseball embed' },
  { metric: 'CLS', target: '≤ 0.1', context: 'Global' },
  { metric: 'INP', target: 'Good (<200ms)', context: 'Navigation, Play button, CTA' },
  { metric: 'TTFB', target: '≤ 600ms', context: 'Edge-rendered routes' },
];

export default function PerformancePage() {
  return (
    <section>
      <h1>Performance Budgets</h1>
      <p className="text-muted" style={{ marginTop: 12 }}>
        Mobile-first instrumentation and Lighthouse CI run on every pull request. Budgets align with Core Web Vitals guidance for
        mid-tier 4G devices.
      </p>
      <table style={{ width: '100%', marginTop: 24, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
            <th style={{ padding: '12px 0' }}>Metric</th>
            <th style={{ padding: '12px 0' }}>Target</th>
            <th style={{ padding: '12px 0' }}>Context</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((row) => (
            <tr key={row.metric} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '12px 0' }}>{row.metric}</td>
              <td style={{ padding: '12px 0' }}>{row.target}</td>
              <td style={{ padding: '12px 0' }}>{row.context}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-muted" style={{ marginTop: 16, fontSize: 13 }}>
        Real user monitoring streams INP, CLS, and LCP metrics from the web app; integrate backend dashboards via analytics
        adapters in `/apps/web/lib/analytics.ts`.
      </p>
    </section>
  );
}
