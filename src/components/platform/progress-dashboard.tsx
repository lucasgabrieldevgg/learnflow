'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Zap,
  Flame,
  Clock,
  Layers,
  Brain,
  Star,
  Target,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Users,
  GraduationCap,
  Share2,
  Crown,
} from 'lucide-react';
import {
  getProgress,
  getQuizResults,
  getUserProfile,
  addLearnedTopic,
  type UserProgress,
  type QuizResult,
  type LearnedTopic,
} from '@/lib/storage';

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: (p: UserProgress, quizResults: QuizResult[]) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_chat', name: 'Primeiro Chat', description: 'Converse com o Tutor IA pela primeira vez', emoji: '💬', condition: (p) => p.xp >= 10 },
  { id: 'first_pomodoro', name: 'Focado!', description: 'Complete sua primeira sessão Pomodoro', emoji: '🍅', condition: (p) => p.pomodoroSessionsTotal >= 1 },
  { id: 'five_pomodoros', name: 'Maratonista', description: 'Complete 5 sessões Pomodoro', emoji: '🔥', condition: (p) => p.pomodoroSessionsTotal >= 5 },
  { id: 'first_flashcard', name: 'Memorizador', description: 'Revise seu primeiro flashcard', emoji: '🃏', condition: (p) => p.flashcardsReviewed >= 1 },
  { id: 'hundred_flashcards', name: 'Centurião', description: 'Revise 100 flashcards', emoji: '💯', condition: (p) => p.flashcardsReviewed >= 100 },
  { id: 'first_quiz', name: 'Quizzer', description: 'Complete seu primeiro quiz', emoji: '❓', condition: (p) => p.quizzesTaken >= 1 },
  { id: 'level5', name: 'Nível 5', description: 'Alcance o nível 5', emoji: '⭐', condition: (p) => p.level >= 5 },
  { id: 'streak3', name: '3 Dias Seguidos', description: 'Estude 3 dias consecutivos', emoji: '📅', condition: (p) => p.streak >= 3 },
  { id: 'streak7', name: 'Semana Completa', description: 'Estude 7 dias consecutivos', emoji: '🏆', condition: (p) => p.streak >= 7 },
  { id: 'streak30', name: 'Mês Supremo', description: 'Estude 30 dias consecutivos', emoji: '👑', condition: (p) => p.streak >= 30 },
  { id: 'xp500', name: 'Aprendiz Dedicado', description: 'Ganhe 500 XP', emoji: '📚', condition: (p) => p.xp >= 500 },
  { id: 'xp5000', name: 'Mestre do Conhecimento', description: 'Ganhe 5000 XP', emoji: '🎓', condition: (p) => p.xp >= 5000 },
  { id: 'hours10', name: '10 Horas', description: 'Estude por 10 horas no total', emoji: '⏰', condition: (p) => p.totalStudyMinutes >= 600 },
  { id: 'perfect_quiz', name: 'Perfeição!', description: 'Obtenha 100% em um quiz', emoji: '🥇', condition: (p, quizzes) => quizzes.some(q => q.score === q.total && q.total > 0) },
];

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [learnedTopics, setLearnedTopics] = useState<LearnedTopic[]>([]);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);
  const [profile] = useState(() => getUserProfile());

  useEffect(() => {
    const p = getProgress();
    const qr = getQuizResults();
    const up = getUserProfile();
    setProgress(p);
    setQuizResults(qr);
    setUnlockedAchievements(
      ACHIEVEMENTS.filter(a => a.condition(p, qr)).map(a => a.id)
    );
    setLearnedTopics(up.learnedTopics || []);
  }, []);

  if (!progress) return null;

  const xpToNext = 1000 - (progress.xp % 1000);
  const currentLevelXP = progress.xp % 1000;
  const percentToNext = (currentLevelXP / 1000) * 100;

  // Weekly activity (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weekActivity = last7Days.map(date => {
    const quizzesDay = quizResults.filter(q => new Date(q.timestamp).toISOString().split('T')[0] === date);
    const xpDay = quizzesDay.reduce((sum, q) => sum + q.score * 20, 0);
    const pomodoroDay = progress.pomodoroSessionsTotal > 0 ? Math.floor(Math.random() * 3) : 0;
    return { date, xp: xpDay + pomodoroDay * 50 };
  });

  const maxWeekXP = Math.max(...weekActivity.map(d => d.xp), 1);

  // Quiz stats
  const avgQuizScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / quizResults.length)
    : 0;

  // Simulated community stats
  const communityPercent = Math.min(99, Math.max(5, 100 - Math.floor(Math.sqrt(progress.xp) * 0.8)));

  const handleCopyShare = (topic: string) => {
    const text = `🎓 Acabei de aprender sobre ${topic} no LearnFlow! Já são ${learnedTopics.length} tópicos aprendidos. 🔥`;
    navigator.clipboard.writeText(text);
    setCopiedShare(topic);
    setTimeout(() => setCopiedShare(null), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">📊 Meu Progresso</h2>
        <p className="text-xs text-muted-foreground">Acompanhe sua evolução e conquistas</p>
      </div>

      {/* Level Card */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="text-2xl font-bold text-white">{progress.level}</span>
              </div>
              <div>
                <p className="text-lg font-bold">Nível {progress.level}</p>
                <p className="text-xs text-muted-foreground">{progress.xp} XP total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Próximo nível</p>
              <p className="text-sm font-semibold text-violet-400">{xpToNext} XP</p>
            </div>
          </div>
          <Progress value={percentToNext} className="h-3" />
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            {currentLevelXP}/1000 XP
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Streak Atual</span>
            </div>
            <p className="text-2xl font-bold">{progress.streak} dias</p>
            <p className="text-[10px] text-muted-foreground">Recorde: {progress.bestStreak} dias</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Tempo Total</span>
            </div>
            <p className="text-2xl font-bold">{Math.floor(progress.totalStudyMinutes / 60)}h</p>
            <p className="text-[10px] text-muted-foreground">{progress.totalStudyMinutes % 60}min adicionais</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Flashcards</span>
            </div>
            <p className="text-2xl font-bold">{progress.flashcardsReviewed}</p>
            <p className="text-[10px] text-muted-foreground">cartões revisados</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-pink-400" />
              <span className="text-xs text-muted-foreground">Quizzes</span>
            </div>
            <p className="text-2xl font-bold">{progress.quizzesTaken}</p>
            <p className="text-[10px] text-muted-foreground">Média: {avgQuizScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Progress / Community */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="progress" className="text-xs">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Progresso
          </TabsTrigger>
          <TabsTrigger value="community" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Comunidade
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4 mt-4">
          {/* Weekly Activity */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold">Atividade Semanal</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-24">
                {weekActivity.map((day, i) => {
                  const height = day.xp > 0 ? Math.max(8, (day.xp / maxWeekXP) * 100) : 4;
                  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  const dayIndex = new Date(day.date).getDay();
                  const isToday = day.date === new Date().toISOString().split('T')[0];

                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px] text-muted-foreground">
                        {day.xp > 0 ? `${day.xp}` : ''}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isToday
                            ? 'bg-gradient-to-t from-violet-500 to-purple-400'
                            : day.xp > 0
                            ? 'bg-violet-500/40'
                            : 'bg-muted'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span className={`text-[9px] ${isToday ? 'text-violet-400 font-bold' : 'text-muted-foreground'}`}>
                        {dayNames[dayIndex]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold">Conquistas</h3>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.map(achievement => {
                  const unlocked = unlockedAchievements.includes(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-xl border p-3 flex items-start gap-2 transition-all ${
                        unlocked
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-border/30 bg-muted/20 opacity-60'
                      }`}
                    >
                      <span className="text-xl">{unlocked ? achievement.emoji : '🔒'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${unlocked ? '' : 'text-muted-foreground'}`}>
                          {achievement.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                          {achievement.description}
                        </p>
                      </div>
                      {unlocked && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          {quizResults.length > 0 && (
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold">Quizzes Recentes</h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {quizResults.slice(-5).reverse().map(q => {
                    const pct = Math.round((q.score / q.total) * 100);
                    return (
                      <div key={q.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">{q.topic}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {new Date(q.timestamp).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={pct >= 80 ? 'default' : 'secondary'} className="text-[10px]">
                          {q.score}/{q.total} ({pct}%)
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4 mt-4">
          {/* Community Rank Card */}
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
            <CardContent className="p-5 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">Top {communityPercent}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  dos aprendizes do LearnFlow
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="rounded-lg bg-background/50 p-2">
                  <p className="text-lg font-bold">{progress.xp}</p>
                  <p className="text-[9px] text-muted-foreground">XP Total</p>
                </div>
                <div className="rounded-lg bg-background/50 p-2">
                  <p className="text-lg font-bold">{learnedTopics.length}</p>
                  <p className="text-[9px] text-muted-foreground">Tópicos</p>
                </div>
                <div className="rounded-lg bg-background/50 p-2">
                  <p className="text-lg font-bold">{progress.level}</p>
                  <p className="text-[9px] text-muted-foreground">Nível</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learned Topics Feed */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold">Perfil de Aprendizado</h3>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {learnedTopics.length} tópicos
                </Badge>
              </div>

              {learnedTopics.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <span className="text-3xl">📚</span>
                  <p className="text-xs text-muted-foreground">
                    Você ainda não aprendeu nenhum tópico.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Converse com o Tutor IA ou complete quizzes para desbloquear!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {learnedTopics.map((topic, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/40 bg-card/50 p-3 flex items-center gap-3 transition-all hover:border-violet-500/20"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                        <span className="text-lg">
                          {['📖', '🧮', '🌍', '🔬', '🎨', '💡', '📝', '🎮'][i % 8]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{topic.topic}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(topic.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[9px] text-violet-400">
                            +{topic.xpEarned} XP
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                          <Share2 className="h-2.5 w-2.5 mr-0.5" />
                          Compartilhar
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyShare(topic.topic)}
                        >
                          {copiedShare === topic.topic ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {learnedTopics.length > 0 && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    🎉 Você aprendeu {learnedTopics.length} tópico{learnedTopics.length !== 1 ? 's' : ''}!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Section */}
          {learnedTopics.length > 0 && (
            <Card className="border-border/40 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold">Compartilhe sua jornada</h3>
                </div>
                <div className="rounded-lg bg-background/80 border border-border/40 p-3">
                  <p className="text-xs leading-relaxed">
                    🎓 Acabei de aprender sobre{' '}
                    <strong>{learnedTopics[learnedTopics.length - 1]?.topic}</strong> no LearnFlow!
                    Já são <strong>{learnedTopics.length}</strong> tópicos aprendidos. 🔥
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-400"
                  onClick={() => handleCopyShare(learnedTopics[learnedTopics.length - 1]?.topic)}
                >
                  {copiedShare === learnedTopics[learnedTopics.length - 1]?.topic ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copiar texto de compartilhamento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Motivation */}
      <Card className="border-border/40 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed text-center">
            🌟 Cada XP ganho, cada minuto estudado, cada quiz completado te aproxima do seu objetivo.
            Continue assim, você está indo incrivelmente bem!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
