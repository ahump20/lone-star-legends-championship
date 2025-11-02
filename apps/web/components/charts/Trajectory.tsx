'use client';

import { useEffect, useRef } from 'react';

export function TrajectoryChart() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b35');
    gradient.addColorStop(1, '#0ea5e9');
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(12, height - 12);
    ctx.quadraticCurveTo(width / 2, height / 3, width - 12, 12);
    ctx.stroke();
  }, []);

  return <canvas ref={ref} width={320} height={180} style={{ width: '100%', borderRadius: 16, background: '#0f172a' }} />;
}

export default TrajectoryChart;
