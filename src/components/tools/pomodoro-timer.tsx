"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

type TimerMode = "work" | "break" | "longBreak";

const DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  work: "Foco",
  break: "Pausa",
  longBreak: "Pausa Longa",
};

const MODE_COLORS: Record<TimerMode, string> = {
  work: "text-red-400",
  break: "text-emerald-400",
  longBreak: "text-amber-400",
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback((newMode?: TimerMode) => {
    setIsRunning(false);
    const m = newMode || mode;
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "work") {
              const newCount = completedPomodoros + 1;
              setCompletedPomodoros(newCount);
              if (newCount % 4 === 0) {
                resetTimer("longBreak");
              } else {
                resetTimer("break");
              }
            } else {
              resetTimer("work");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, completedPomodoros, resetTimer]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = DURATIONS[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-6">
        {/* Mode selector */}
        <div className="flex gap-2">
          {(["work", "break", "longBreak"] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => resetTimer(m)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                mode === m
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="relative flex items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${MODE_COLORS[mode]} transition-all duration-1000 ease-linear`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-4xl font-bold tabular-nums ${MODE_COLORS[mode]}`}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {MODE_LABELS[mode]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => resetTimer()}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className={`h-12 w-12 rounded-full ${
              isRunning ? "bg-destructive hover:bg-destructive/90" : ""
            }`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => resetTimer(mode === "work" ? "break" : "work")}
          >
            <Coffee className="h-4 w-4" />
          </Button>
        </div>

        {/* Completed pomodoros */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sessões:</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(completedPomodoros, 12) }).map((_, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-full bg-primary/60"
              />
            ))}
            {completedPomodoros === 0 && (
              <span className="text-xs text-muted-foreground/50">Nenhuma ainda</span>
            )}
          </div>
          {completedPomodoros > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completedPomodoros}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
