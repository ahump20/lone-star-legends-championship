'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createInitialSnapshot, GameEngine } from './engine';
import type { GameSnapshot, SluggerProfile, StadiumProfile } from '../../lib/gameTypes';
import { sluggerProfiles } from '../../lib/characters';
import { stadiumProfiles } from '../../lib/stadiums';

const defaultSlugger = sluggerProfiles[0];
const defaultStadium = stadiumProfiles[0];

export function BackyardLegendsGame() {
  const [selectedSluggerId, setSelectedSluggerId] = useState(defaultSlugger.id);
  const [selectedStadiumId, setSelectedStadiumId] = useState(defaultStadium.id);

  const activeSlugger = useMemo(
    () =>
      sluggerProfiles.find((slugger: SluggerProfile) => slugger.id === selectedSluggerId) ??
      defaultSlugger,
    [selectedSluggerId],
  );

  const activeStadium = useMemo(
    () =>
      stadiumProfiles.find((stadium: StadiumProfile) => stadium.id === selectedStadiumId) ??
      defaultStadium,
    [selectedStadiumId],
  );

  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    createInitialSnapshot(defaultSlugger, defaultStadium),
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const engine = new GameEngine(canvas, (state) => setSnapshot(state), {
      slugger: activeSlugger,
      stadium: activeStadium,
    });
    engineRef.current = engine;

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : 360;
      const height = Math.max(280, Math.min(520, width * 0.62));
      const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      engine.setDimensions(width, height, ratio);
    };

    resize();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      observer = new ResizeObserver(resize);
      observer.observe(canvas.parentElement);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', resize);
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        engine.swing();
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }
    engine.setLoadout(activeSlugger, activeStadium);
  }, [activeSlugger, activeStadium]);

  const countdownSeconds = snapshot.countdown ? Math.ceil(snapshot.countdown / 100) / 10 : null;

  return (
    <section className="section game-shell" aria-labelledby="backyard-blaze-game">
      <div className="game-header">
        <div>
          <h2 id="backyard-blaze-game">Backyard Blaze League — Mobile Sandlot Showdown</h2>
          <p>
            Tap-friendly baseball built for BlazeSportsIntel.com. Pick a kid legend, lock in a
            backyard stadium, and chase three-inning glory with timing-based swings, streak bonuses,
            and CPU duels tuned for endless rematches.
          </p>
        </div>
        <div className="game-header__note" role="status" aria-live="polite">
          {snapshot.difficultyNote}
        </div>
      </div>
      <div className="game-wrapper">
        <div className="canvas-shell">
          <canvas ref={canvasRef} role="img" aria-label="Backyard baseball sandlot simulation" />
          <div className="hud" aria-live="polite">
            <div className="hud__score">
              <span>Inning {snapshot.inning}</span>
              <span>
                Score {snapshot.playerScore} - {snapshot.cpuScore}
              </span>
              <span>{snapshot.outs} {snapshot.outs === 1 ? 'out' : 'outs'}</span>
            </div>
            <p className="hud__message">{snapshot.message}</p>
            <div className="hud__meta">
              <span>Streak: {snapshot.streak}</span>
              <span>{countdownSeconds ? `Next action in ${countdownSeconds.toFixed(1)}s` : 'Ready'}</span>
              {snapshot.resultBanner ? <span className="hud__banner">{snapshot.resultBanner}</span> : null}
            </div>
          </div>
        </div>
        <div className="control-panel">
          <fieldset>
            <legend>Choose Your Slugger</legend>
            <div className="choice-list">
              {sluggerProfiles.map((slugger: SluggerProfile) => {
                const isActive = slugger.id === selectedSluggerId;
                return (
                  <label key={slugger.id} className={`choice-card ${isActive ? 'choice-card--active' : ''}`}>
                    <input
                      type="radio"
                      name="slugger"
                      value={slugger.id}
                      checked={isActive}
                      onChange={() => setSelectedSluggerId(slugger.id)}
                    />
                    <span className="choice-card__title">
                      {slugger.featuredEmoji} {slugger.nickname}
                    </span>
                    <span className="choice-card__meta">{slugger.description}</span>
                    <span className="choice-card__metrics">
                      Power {slugger.power}/5 • Contact {slugger.contact}/5
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend>Select a Stadium</legend>
            <div className="choice-list">
              {stadiumProfiles.map((stadium: StadiumProfile) => {
                const isActive = stadium.id === selectedStadiumId;
                return (
                  <label key={stadium.id} className={`choice-card ${isActive ? 'choice-card--active' : ''}`}>
                    <input
                      type="radio"
                      name="stadium"
                      value={stadium.id}
                      checked={isActive}
                      onChange={() => setSelectedStadiumId(stadium.id)}
                    />
                    <span className="choice-card__title">{stadium.name}</span>
                    <span className="choice-card__meta">{stadium.backdrop}</span>
                    <span className="choice-card__metrics">
                      Timing +{stadium.timingBonus}ms • Power +
                      {Math.round(stadium.powerBonus * 100)}%
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="control-panel__actions">
            <button
              type="button"
              className="primary"
              onClick={() => engineRef.current?.startSeason()}
            >
              Play Ball
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => engineRef.current?.swing()}
              disabled={!snapshot.canSwing}
            >
              Swing!
            </button>
          </div>
          <div className="history">
            <h3>Recent Plays</h3>
            <ul>
              {snapshot.history.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.label}</strong>
                  <span>{entry.detail}</span>
                  {entry.runsScored ? <em> Runs: {entry.runsScored}</em> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
