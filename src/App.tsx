import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { useGameLoop } from './hooks/useGameLoop';
import Logo from '../bfb50853-a2fa-40ef-94f0-798ad786b76a.png';

interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  rageQuit: boolean;
  gameCompleted: boolean;
  score: number;
  level: number;
  deathCount: number;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState({
    score: 0,
    level: 1,
    deaths: 0,
    isPlaying: false,
    gameComplete: false,
  });

  const sessionRef = useRef<SessionMetrics>({
    sessionId: crypto.randomUUID(),
    startTime: Date.now(),
    rageQuit: false,
    gameCompleted: false,
    score: 0,
    level: 1,
    deathCount: 0,
  });

  const rapidDeathsRef = useRef<number[]>([]);
  const RAGE_QUIT_THRESHOLD = 3;
  const RAGE_QUIT_WINDOW = 30000;

  const trackDeath = () => {
    const now = Date.now();
    rapidDeathsRef.current.push(now);
    rapidDeathsRef.current = rapidDeathsRef.current.filter(
      (time) => now - time < RAGE_QUIT_WINDOW
    );
    if (rapidDeathsRef.current.length >= RAGE_QUIT_THRESHOLD) {
      sessionRef.current.rageQuit = true;
    }
    setGameState((prev) => ({
      ...prev,
      deaths: prev.deaths + 1,
    }));
    sessionRef.current.deathCount++;
  };

  const endSession = (completed: boolean = false) => {
    const session = sessionRef.current;
    session.endTime = Date.now();
    session.gameCompleted = completed;
    session.score = gameState.score;
    session.level = gameState.level;

    const sessionTime = session.endTime - session.startTime;
    if (sessionTime < 30000 && session.score === 0) {
      const rageCount = parseInt(localStorage.getItem('lsl_rageQuitCount') || '0', 10);
      localStorage.setItem('lsl_rageQuitCount', (rageCount + 1).toString());
    } else {
      const completedSessions = parseInt(localStorage.getItem('lsl_completedSessions') || '0', 10);
      localStorage.setItem('lsl_completedSessions', (completedSessions + 1).toString());
    }

    console.log('Session metrics', session);
    fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    }).catch((err) => console.error(err));
  };

  useEffect(() => {
    const handleUnload = () => {
      if (gameState.isPlaying && !gameState.gameComplete) {
        endSession(false);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [gameState.isPlaying, gameState.gameComplete]);

  const update = (deltaTime: number) => {
    // Physics and game logic update
  };

  const render = () => {
    // Rendering logic
  };

  useGameLoop(update, render);

  return (
    <div className="game-container">
      <header style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
        <img src={Logo} alt="Lone Star Legends Logo" style={{ width: '64px', height: '64px', marginRight: '1rem' }} />
        <h1>Lone Star Legends</h1>
      </header>
      <GameCanvas
        gameState={gameState}
        onDeath={trackDeath}
        onComplete={() => endSession(true)}
      />
    </div>
  );
};

export default App;
