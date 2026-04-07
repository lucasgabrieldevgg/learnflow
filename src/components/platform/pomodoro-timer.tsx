'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  Check,
} from 'lucide-react';
import { getPomodoroStats, setPomodoroStats, getProgress, setProgress, addXP, getToday } from '@/lib/storage';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function PomodoroTimer() {
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState(getPomodoroStats());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDuration = mode === 'work' ? workDuration : mode === 'shortBreak' ? shortBreakDuration : longBreakDuration;
  const progress = (totalDuration * 60 - timeLeft) / (totalDuration * 60);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress * circumference);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Use a ref to track when timer ends and handle transition outside effects
  const timerEndedRef = useRef(false);

  const handleTimerEnd = useCallback(() => {
    if (mode === 'work') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      addXP(50);

      // Update stats
      const todayStr = getToday();
      const newStats = { ...stats };
      if (newStats.lastDate !== todayStr) {
        newStats.todaySessions = 0;
        newStats.todayMinutes = 0;
      }
      newStats.todaySessions++;
      newStats.todayMinutes += workDuration;
      newStats.weekSessions++;
      newStats.lastDate = todayStr;
      setPomodoroStats(newStats);
      setStats(newStats);

      // Update progress
      const p = getProgress();
      p.pomodoroSessionsToday = newStats.todaySessions;
      p.pomodoroSessionsTotal++;
      p.totalStudyMinutes += workDuration;
      setProgress(p);

      // Auto switch to break
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(longBreakDuration * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(shortBreakDuration * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
    timerEndedRef.current = false;
  }, [mode, sessions, workDuration, shortBreakDuration, longBreakDuration, stats]);

  // Process timer end outside of effects via a microtask
  useEffect(() => {
    if (timerEndedRef.current) {
      timerEndedRef.current = false;
      const id = requestAnimationFrame(() => {
        handleTimerEnd();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [timeLeft, isRunning, handleTimerEnd]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playBeep();
            timerEndedRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, playBeep]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration * 60);
  };

  const skipPhase = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setMode('shortBreak');
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
  };

  const switchMode = (m: TimerMode) => {
    setIsRunning(false);
    setMode(m);
    if (m === 'work') setTimeLeft(workDuration * 60);
    else if (m === 'shortBreak') setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const modeLabel = mode === 'work' ? 'Foco' : mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa';
  const modeColor = mode === 'work' ? 'text-red-400' : mode === 'shortBreak' ? 'text-emerald-400' : 'text-blue-400';
  const strokeColor = mode === 'work' ? '#f87171' : mode === 'shortBreak' ? '#34d399' : '#60a5fa';

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          🍅 Pomodoro Timer
        </h2>
        <p className="text-xs text-muted-foreground">Estude com foco, descanse com intenção</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex rounded-lg bg-muted/50 p-1 gap-1">
        {[
          { m: 'work' as TimerMode, label: 'Foco' },
          { m: 'shortBreak' as TimerMode, label: 'Pausa Curta' },
          { m: 'longBreak' as TimerMode, label: 'Pausa Longa' },
        ].map(({ m, label }) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              mode === m
                ? m === 'work'
                  ? 'bg-red-500/20 text-red-400'
                  : m === 'shortBreak'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-blue-500/20 text-blue-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Circular Timer */}
      <div className="flex justify-center py-4">
        <div className="relative">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xs font-medium ${modeColor}`}>{modeLabel}</span>
            <span className="text-5xl font-bold tabular-nums mt-1">{formatTime(timeLeft)}</span>
            <Badge variant="secondary" className="mt-2 text-[10px]">
              {sessions} sessões completas
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={resetTimer}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          className={`h-14 w-14 rounded-full shadow-lg ${
            isRunning
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
              : mode === 'work'
              ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'
              : mode === 'shortBreak'
              ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
          }`}
          onClick={toggleTimer}
        >
          {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={skipPhase}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Sound Toggle */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5 mr-1.5" /> : <VolumeX className="h-3.5 w-3.5 mr-1.5" />}
          Som {soundEnabled ? 'ativado' : 'desativado'}
        </Button>
      </div>

      {/* Settings */}
      {showSettings && (
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Configurações</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Foco (min)</Label>
                <Input
                  type="number"
                  value={workDuration}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1;
                    setWorkDuration(v);
                    if (mode === 'work' && !isRunning) setTimeLeft(v * 60);
                  }}
                  className="h-8 text-sm"
                  min={1}
                  max={120}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pausa Curta (min)</Label>
                <Input
                  type="number"
                  value={shortBreakDuration}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1;
                    setShortBreakDuration(v);
                    if (mode === 'shortBreak' && !isRunning) setTimeLeft(v * 60);
                  }}
                  className="h-8 text-sm"
                  min={1}
                  max={30}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pausa Longa (min)</Label>
                <Input
                  type="number"
                  value={longBreakDuration}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1;
                    setLongBreakDuration(v);
                    if (mode === 'longBreak' && !isRunning) setTimeLeft(v * 60);
                  }}
                  className="h-8 text-sm"
                  min={1}
                  max={60}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Estatísticas
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Config
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-lg font-bold text-red-400">{stats.todaySessions}</p>
              <p className="text-[10px] text-muted-foreground">Sessões hoje</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-lg font-bold text-amber-400">{stats.todayMinutes}min</p>
              <p className="text-[10px] text-muted-foreground">Minutos hoje</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-lg font-bold text-purple-400">{stats.weekSessions}</p>
              <p className="text-[10px] text-muted-foreground">Sessões na semana</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{sessions}</p>
              <p className="text-[10px] text-muted-foreground">Ciclo atual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-border/40 bg-gradient-to-br from-red-500/5 to-orange-500/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 <strong>Dica Pomodoro:</strong> Estude em blocos de 25 minutos com foco total, depois faça uma pausa de 5 minutos. A cada 4 sessões, faça uma pausa longa de 15 minutos. Isso mantém seu cérebro descansado e produtivo!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
