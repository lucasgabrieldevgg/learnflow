"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Flame, BookOpen, Trophy } from "lucide-react";

interface ProgressData {
  streak: number;
  sessionsCompleted: number;
  totalTime: number;
  techniquesLearned: number;
}

const STORAGE_KEY = "mente-ninja-progress";

function loadProgress(): ProgressData {
  if (typeof window === "undefined") {
    return { streak: 0, sessionsCompleted: 0, totalTime: 0, techniquesLearned: 0 };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { streak: 0, sessionsCompleted: 0, totalTime: 0, techniquesLearned: 0 };
}

function saveProgress(data: ProgressData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

const milestones = [
  { sessions: 1, label: "Primeiro passo! 🎉", reward: "A jornada começou" },
  { sessions: 5, label: "Dedicado! ⭐", reward: "5 sessões completadas" },
  { sessions: 10, label: "Ninja em treino! 🥷", reward: "10 sessões — sério compromisso" },
  { sessions: 25, label: "Mestre aprendiz! 📚", reward: "25 sessões — impressionante" },
  { sessions: 50, label: "Ninja da aprendizagem! 🏆", reward: "50 sessões — você é incrível" },
];

export function updateProgressSession() {
  const data = loadProgress();
  const today = new Date().toISOString().split("T")[0];
  
  const lastStudyDate = localStorage.getItem("mente-ninja-last-date");
  let newStreak = data.streak;

  if (lastStudyDate) {
    const lastDate = new Date(lastStudyDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  localStorage.setItem("mente-ninja-last-date", today);

  const updated: ProgressData = {
    streak: newStreak,
    sessionsCompleted: data.sessionsCompleted + 1,
    totalTime: data.totalTime + 25 * 60, // approximate 25 min per session
    techniquesLearned: Math.min(data.techniquesLearned + 1, 6),
  };
  saveProgress(updated);
  return updated;
}

export default function ProgressTracker() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress);

  const refresh = () => setProgress(loadProgress());

  React.useEffect(() => {
    refresh();
  }, []);

  const currentMilestone = [...milestones].reverse().find((m) => progress.sessionsCompleted >= m.sessions);
  const nextMilestone = milestones.find((m) => progress.sessionsCompleted < m.sessions);

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/40 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col items-center p-4">
            <Flame className="h-6 w-6 text-orange-400 mb-1" />
            <span className="text-2xl font-bold">{progress.streak}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Dias seguidos
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col items-center p-4">
            <BookOpen className="h-6 w-6 text-primary mb-1" />
            <span className="text-2xl font-bold">{progress.sessionsCompleted}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Sessões
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col items-center p-4">
            <Clock className="h-6 w-6 text-emerald-400 mb-1" />
            <span className="text-2xl font-bold">{formatTime(progress.totalTime)}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Tempo total
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col items-center p-4">
            <Trophy className="h-6 w-6 text-amber-400 mb-1" />
            <span className="text-2xl font-bold">
              {progress.techniquesLearned}/6
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Técnicas
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Current milestone */}
      {currentMilestone && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium">{currentMilestone.label}</div>
              <div className="text-xs text-muted-foreground">{currentMilestone.reward}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next milestone */}
      {nextMilestone && (
        <Card className="border-border/40 bg-card/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Próximo: {nextMilestone.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {progress.sessionsCompleted}/{nextMilestone.sessions}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{
                  width: `${(progress.sessionsCompleted / nextMilestone.sessions) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={() => {
          if (confirm("Deseja resetar seu progresso?")) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem("mente-ninja-last-date");
            refresh();
          }
        }}
      >
        Resetar progresso
      </Button>
    </div>
  );
}
