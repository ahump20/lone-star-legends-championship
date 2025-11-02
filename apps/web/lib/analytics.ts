'use client';

type GameEvent = {
  source: string;
  event: string;
  payload?: Record<string, unknown>;
  timestamp: number;
};

export function registerGameAnalytics(handler: (event: GameEvent) => void) {
  const listener = (message: MessageEvent<GameEvent>) => {
    if (message.data?.source !== 'bsi-bbp-web') return;
    handler(message.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
