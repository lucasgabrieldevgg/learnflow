'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  Wind,
  Heart,
  Sparkles,
} from 'lucide-react';

type BreathingTechnique = {
  id: string;
  name: string;
  emoji: string;
  phases: { label: string; duration: number }[];
  cycles: number;
};

const TECHNIQUES: BreathingTechnique[] = [
  {
    id: '478',
    name: 'Respiração 4-7-8',
    emoji: '🌙',
    phases: [
      { label: 'Inspire', duration: 4 },
      { label: 'Segure', duration: 7 },
      { label: 'Expire', duration: 8 },
    ],
    cycles: 4,
  },
  {
    id: 'box',
    name: 'Box Breathing',
    emoji: '📦',
    phases: [
      { label: 'Inspire', duration: 4 },
      { label: 'Segure', duration: 4 },
      { label: 'Expire', duration: 4 },
      { label: 'Segure', duration: 4 },
    ],
    cycles: 4,
  },
  {
    id: 'relaxing',
    name: 'Respiração Calmante',
    emoji: '🌊',
    phases: [
      { label: 'Inspire', duration: 5 },
      { label: 'Expire', duration: 5 },
    ],
    cycles: 6,
  },
  {
    id: 'energize',
    name: 'Respiração Energizante',
    emoji: '⚡',
    phases: [
      { label: 'Inspire', duration: 2 },
      { label: 'Expire', duration: 2 },
    ],
    cycles: 10,
  },
];

export default function BreathingExercise() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>(TECHNIQUES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [scale, setScale] = useState(0.6);
  const [phaseText, setPhaseText] = useState('Pronto');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTick = useCallback((freq: number) => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  const startExercise = () => {
    setIsRunning(true);
    setCurrentPhase(0);
    setTimeLeft(selectedTechnique.phases[0].duration);
    setCycleCount(0);
    setPhaseText(selectedTechnique.phases[0].label);
    setScale(0.6);
    playTick(440);
  };

  const stopExercise = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhaseText('Pausado');
    setScale(0.6);
  };

  const resetExercise = () => {
    stopExercise();
    setCurrentPhase(0);
    setTimeLeft(selectedTechnique.phases[0].duration);
    setCycleCount(0);
    setPhaseText('Pronto');
  };

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          setCurrentPhase(p => {
            let nextPhase = p + 1;
            if (nextPhase >= selectedTechnique.phases.length) {
              // New cycle
              setCycleCount(c => {
                const newC = c + 1;
                if (newC >= selectedTechnique.cycles) {
                  setIsRunning(false);
                  setTotalCompleted(t => t + 1);
                  setPhaseText('✓ Completo!');
                  return newC;
                }
                return newC;
              });
              nextPhase = 0;
            }
            const phase = selectedTechnique.phases[nextPhase];
            setPhaseText(phase.label);
            setTimeLeft(phase.duration);
            playTick(nextPhase % 2 === 0 ? 523 : 392);
            return phase.duration;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, selectedTechnique, playTick]);

  // Animate scale
  useEffect(() => {
    if (!isRunning) return;
    const phase = selectedTechnique.phases[currentPhase];
    if (!phase) return;

    const isInhale = phase.label === 'Inspire';
    const targetScale = isInhale ? 1 : 0.6;
    const duration = phase.duration * 1000;

    const startTime = Date.now();
    const startScale = scale;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setScale(startScale + (targetScale - startScale) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [currentPhase, isRunning, selectedTechnique]);

  const selectTechnique = (t: BreathingTechnique) => {
    if (isRunning) return;
    setSelectedTechnique(t);
    setTimeLeft(t.phases[0].duration);
    setCurrentPhase(0);
    setCycleCount(0);
    setPhaseText('Pronto');
    setScale(0.6);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">🫁 Exercício de Respiração</h2>
        <p className="text-xs text-muted-foreground">Relaxe e concentre-se antes de estudar</p>
      </div>

      {/* Technique Selection */}
      <div className="grid grid-cols-2 gap-2">
        {TECHNIQUES.map(t => (
          <button
            key={t.id}
            onClick={() => selectTechnique(t)}
            className={`rounded-xl border p-3 text-left transition-all ${
              selectedTechnique.id === t.id
                ? 'border-violet-500/50 bg-violet-500/10'
                : 'border-border/40 bg-card/50 hover:border-violet-500/20'
            } ${isRunning ? 'pointer-events-none opacity-50' : ''}`}
          >
            <span className="text-xl">{t.emoji}</span>
            <p className="text-xs font-semibold mt-1">{t.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {t.phases.map(p => `${p.duration}s`).join(' · ')}
            </p>
          </button>
        ))}
      </div>

      {/* Breathing Circle */}
      <div className="flex flex-col items-center py-8">
        <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
          {/* Background circles */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/5 to-purple-500/5" />
          <div
            className="rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 transition-transform duration-100 flex items-center justify-center"
            style={{
              width: 200 * scale,
              height: 200 * scale,
              boxShadow: isRunning ? `0 0 ${60 * scale}px ${scale > 0.8 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)'}` : 'none',
            }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold">{selectedTechnique.emoji}</p>
              <p className="text-lg font-semibold mt-1">{phaseText}</p>
              <p className="text-3xl font-bold tabular-nums">{timeLeft}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Progress */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: selectedTechnique.cycles }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full transition-all ${
              i < cycleCount
                ? 'bg-violet-500'
                : i === cycleCount && isRunning
                ? 'bg-violet-500/50 animate-pulse'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={resetExercise}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20"
          onClick={isRunning ? stopExercise : startExercise}
        >
          {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
        <div className="h-10 w-10" />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-xl font-bold text-violet-400">{totalCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Sessões completas</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-400">{cycleCount}/{selectedTechnique.cycles}</p>
          <p className="text-[10px] text-muted-foreground">Ciclo atual</p>
        </div>
      </div>

      {/* Tips */}
      <Card className="border-border/40 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            🧘 <strong>Dica:</strong> Faça exercícios de respiração antes de estudar para acalmar a mente e melhorar o foco. A técnica 4-7-8 é especialmente boa para reduzir ansiedade antes de provas!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
