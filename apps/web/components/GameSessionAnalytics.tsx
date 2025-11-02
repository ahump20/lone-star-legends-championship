'use client';

import { useEffect, useState } from 'react';
import { registerGameAnalytics } from '@/lib/analytics';

type EventLog = {
  event: string;
  timestamp: number;
  payload?: Record<string, unknown>;
};

export function GameSessionAnalytics() {
  const [events, setEvents] = useState<EventLog[]>([]);

  useEffect(() => {
    return registerGameAnalytics((message) => {
      setEvents((prev) => [...prev.slice(-4), { event: message.event, timestamp: message.timestamp, payload: message.payload }]);
    });
  }, []);

  if (events.length === 0) {
    return (
      <div className="card">
        <h3>Game Telemetry</h3>
        <p className="text-muted">Launch Sandlot Sluggers to stream live session events without blocking page performance.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Game Telemetry</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
        {events.map((event, index) => (
          <li key={`${event.event}-${index}`} style={{ fontSize: 13, color: '#e2e8f0' }}>
            <strong>{event.event}</strong>
            <span style={{ marginLeft: 8, opacity: 0.6 }}>{new Date(event.timestamp).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GameSessionAnalytics;
