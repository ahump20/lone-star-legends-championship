import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { useGameLoop } from './hooks/useGameLoop';

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
    gameComplete: false
  });

  const sessionRef = useRef<SessionMetrics>({
    sessionId: crypto.randomUUID(),
    startTime: Date.now(),
    rageQuit: false,
    gameCompleted: false,
    score: 0,
    level: 1,
    deathCount: 0
  });

  // Track rage-quit patterns
  const rapidDeathsRef = useRef<number[]>([]);
  const RAGE_QUIT_THRESHOLD = 3; // 3 deaths in 30 seconds
  const RAGE_QUIT_WINDOW = 30000; // 30 seconds

  const trackDeath = () => {
    const now = Date.now();
    rapidDeathsRef.current.push(now);
    
    // Clean old deaths outside window
    rapidDeathsRef.current = rapidDeathsRef.current.filter(
      time => now - time < RAGE_QUIT_WINDOW
    );
    
    // Check for rage-quit pattern
    if (rapidDeathsRef.current.length >= RAGE_QUIT_THRESHOLD) {
      sessionRef.current.rageQuit = true;
    }
    
    setGameState(prev => ({
      ...prev,
      deaths: prev.deaths + 1
    }));
    
    sessionRef.current.deathCount++;
  };

  const endSession = (completed: boolean = false) => {
    const session = sessionRef.current;
    session.endTime = Date.now();
    session.gameCompleted = completed;
    session.score = gameState.score;
    session.level = gameState.level;
    
    // Send metrics to analytics
    console.log('Session Metrics:', {
      ...session,
      sessionDuration: (session.endTime - session.startTime) / 1000,
      avgDeathsPerLevel: session.deathCount / session.level
    });
    
    // Post to analytics endpoint
    fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    }).catch(console.error);
  };

  // Track window close/navigation
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

  // Game loop integration
  const update = (deltaTime: number) => {
    // Game physics update logic here
  };
  
  const render = () => {
    // Render logic here
  };
  
  useGameLoop(update, render);
  
  return (
    <div className="game-container">
      <GameCanvas 
        gameState={gameState}
        onDeath={trackDeath}
        onComplete={() => endSession(true)}
      />
    </div>
  );
};

export default App;
