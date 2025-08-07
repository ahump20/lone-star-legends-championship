import { useEffect, useRef, useCallback } from 'react';

const PHYSICS_TIMESTEP = 1000 / 60; // 60 FPS physics
const MAX_FRAME_SKIP = 5;

export const useGameLoop = (updateCallback: (deltaTime: number) => void, renderCallback: () => void) => {
  const animationFrameId = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = Math.min(timestamp - lastTimeRef.current, 1000 / 10); // Cap at 100ms
    lastTimeRef.current = timestamp;

    accumulatorRef.current += deltaTime;

    let frameSkipCount = 0;
    while (accumulatorRef.current >= PHYSICS_TIMESTEP && frameSkipCount < MAX_FRAME_SKIP) {
      updateCallback(PHYSICS_TIMESTEP / 1000); // Convert to seconds
      accumulatorRef.current -= PHYSICS_TIMESTEP;
      frameSkipCount++;
    }

    // Prevent spiral of death
    if (accumulatorRef.current > PHYSICS_TIMESTEP * MAX_FRAME_SKIP) {
      accumulatorRef.current = 0;
    }

    renderCallback();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [updateCallback, renderCallback]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop]);
};
