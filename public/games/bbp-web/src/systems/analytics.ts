export type AnalyticsPayload = Record<string, unknown> | undefined;

export function sendAnalyticsEvent(event: string, payload: AnalyticsPayload = undefined) {
  if (typeof window === 'undefined') return;
  window.parent?.postMessage(
    {
      source: 'bsi-bbp-web',
      event,
      payload,
      timestamp: Date.now(),
    },
    '*'
  );
}
