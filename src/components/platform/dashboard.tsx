'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProgress, addXP, type UserProgress } from '@/lib/storage';
import { type ViewId } from './sidebar';
import {
  Flame,
  Zap,
  Trophy,
  Clock,
  ArrowRight,
  Star,
  Target,
  BookOpen,
  Quote,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: ViewId) => void;
}

const motivationalQuotes = [
  { text: 'A aprendizagem é uma jornada, não um destino.', author: 'Anônimo' },
  { text: 'O conhecimento é a única riqueza que aumenta quando dividida.', author: 'Provérbio Árabe' },
  { text: 'Estudar sem pensar é inútil. Pensar sem estudar é perigoso.', author: 'Confúcio' },
  { text: 'A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.', author: 'Albert Einstein' },
  { text: 'Não é o mais forte que sobrevive, mas o que melhor se adapta às mudanças.', author: 'Charles Darwin' },
  { text: 'O segredo de ir adiante é começar.', author: 'Mark Twain' },
  { text: 'Todo expert já foi um iniciante.', author: 'Helen Hayes' },
];

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [quote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  useEffect(() => {
    const p = getProgress();
    // Check for new day reset of pomodoro
    const today = new Date().toISOString().split('T')[0];
    if (p.lastStudyDate !== today) {
      p.pomodoroSessionsToday = 0;
    }
    setProgress(p);
  }, []);

  const xpToNextLevel = progress ? (progress.level * 1000 - progress.xp % 1000) : 0;
  const xpInLevel = progress ? (progress.xp % 1000) : 0;

  const quickTools = [
    { id: 'ai-tutor' as ViewId, emoji: '🤖', label: 'Tutor IA', desc: 'Aprenda com IA', color: 'from-violet-500/20 to-purple-500/20' },
    { id: 'pomodoro' as ViewId, emoji: '🍅', label: 'Pomodoro', desc: 'Foco 25min', color: 'from-red-500/20 to-orange-500/20' },
    { id: 'flashcards' as ViewId, emoji: '🃏', label: 'Flashcards', desc: 'Revisão ativa', color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'quiz' as ViewId, emoji: '❓', label: 'Quiz IA', desc: 'Teste-se', color: 'from-emerald-500/20 to-teal-500/20' },
    { id: 'feynman' as ViewId, emoji: '🧠', label: 'Feynman', desc: 'Explique', color: 'from-amber-500/20 to-yellow-500/20' },
    { id: 'focus-sounds' as ViewId, emoji: '🎵', label: 'Sons Foco', desc: 'Concentração', color: 'from-pink-500/20 to-rose-500/20' },
  ];

  const allTools = [
    { id: 'cornell-notes' as ViewId, emoji: '📝', label: 'Notas Cornell' },
    { id: 'planner' as ViewId, emoji: '📋', label: 'Planejador' },
    { id: 'habits' as ViewId, emoji: '✅', label: 'Hábitos' },
    { id: 'breathing' as ViewId, emoji: '🫁', label: 'Respiração' },
    { id: 'progress' as ViewId, emoji: '📊', label: 'Progresso' },
    { id: 'settings' as ViewId, emoji: '⚙️', label: 'Configurações' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 overflow-y-auto h-full">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold md:text-3xl">
          Bem-vindo ao LearnFlow! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Sua jornada de aprendizagem começa aqui. Vamos juntos!
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <Card className="border-border/40 bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-muted-foreground">XP Total</span>
            </div>
            <p className="text-2xl font-bold">{progress?.xp ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Nível</span>
            </div>
            <p className="text-2xl font-bold">{progress?.level ?? 1}</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <p className="text-2xl font-bold">{progress?.streak ?? 0} dias</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-cyan-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Horas Estudo</span>
            </div>
            <p className="text-2xl font-bold">{progress ? Math.round(progress.totalStudyMinutes / 60) : 0}h</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Level Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold">Nível {progress?.level ?? 1}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {xpInLevel}/1000 XP para próximo nível
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(xpInLevel / 1000) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Button
          size="lg"
          className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20"
          onClick={() => onNavigate('ai-tutor')}
        >
          <Target className="h-5 w-5 mr-2" />
          Começar a Aprender
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>

      {/* Quick Access Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Acesso Rápido</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickTools.map((tool) => (
            <Card
              key={tool.id}
              className="cursor-pointer border-border/40 hover:border-violet-500/30 transition-all duration-200 hover:shadow-md hover:shadow-violet-500/5 group"
              onClick={() => onNavigate(tool.id)}
            >
              <CardContent className={`p-4 bg-gradient-to-br ${tool.color}`}>
                <div className="text-2xl mb-2">{tool.emoji}</div>
                <p className="text-sm font-semibold">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* All Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-muted-foreground">Todas as Ferramentas</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {allTools.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3 text-left transition-all hover:bg-muted/50 hover:border-violet-500/20"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm font-medium">{item.label}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="border-border/40 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Quote className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm italic leading-relaxed text-foreground/90">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="h-4" />
    </div>
  );
}
