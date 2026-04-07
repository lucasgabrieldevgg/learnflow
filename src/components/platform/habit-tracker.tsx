'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Flame,
  Target,
  Check,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import {
  getHabits,
  setHabits,
  generateId,
  getToday,
  addXP,
  type Habit,
} from '@/lib/storage';

const HABIT_ICONS = ['📖', '💪', '🧘', '📝', '🃏', '🍅', '🏃', '💤', '🥗', '🎵', '🧹', '💡'];

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatDate(day: number, month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function HabitTracker() {
  const [habits, setHabitsState] = useState<Habit[]>(() => getHabits());
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📖');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const refresh = () => setHabitsState(getHabits());

  const addHabit = () => {
    if (!newName.trim()) return;
    const habit: Habit = {
      id: generateId(),
      name: newName.trim(),
      icon: newIcon,
      completedDates: [],
      createdAt: Date.now(),
    };
    const updated = [...habits, habit];
    setHabitsState(updated);
    setHabits(updated);
    setShowAdd(false);
    setNewName('');
  };

  const deleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    setHabitsState(updated);
    setHabits(updated);
  };

  const toggleHabit = (habitId: string) => {
    const today = getToday();
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const dates = h.completedDates.includes(today)
        ? h.completedDates.filter(d => d !== today)
        : [...h.completedDates, today];
      return { ...h, completedDates: dates };
    });
    setHabitsState(updated);
    setHabits(updated);

    // Check if just completed
    const habit = updated.find(h => h.id === habitId);
    if (habit?.completedDates.includes(today)) {
      addXP(10);
    }
  };

  const getStreak = (habit: Habit): number => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getBestStreak = (habit: Habit): number => {
    if (habit.completedDates.length === 0) return 0;
    const sorted = [...habit.completedDates].sort();
    let best = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else if (diff > 1) {
        current = 1;
      }
    }
    return best;
  };

  const today = getToday();
  const todayCompleted = habits.filter(h => h.completedDates.includes(today)).length;

  // Month calendar
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">✅ Hábitos</h2>
        <p className="text-xs text-muted-foreground">Crie rotinas e mantenha a consistência</p>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/40 bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-violet-400">{todayCompleted}/{habits.length}</p>
            <p className="text-[10px] text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-orange-400">
              {habits.length > 0 ? Math.max(...habits.map(getStreak)) : 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Maior Streak</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">
              {habits.reduce((sum, h) => sum + h.completedDates.length, 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Habits */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <CheckSquare className="h-3.5 w-3.5 text-violet-400" />
            Hábitos de Hoje
          </h3>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Hábito</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs">Nome do hábito</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Estudar 30min" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Ícone</label>
                  <div className="flex gap-2 flex-wrap">
                    {HABIT_ICONS.map(icon => (
                      <button
                        key={icon}
                        className={`h-9 w-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                          newIcon === icon ? 'bg-violet-500/20 border-2 border-violet-500' : 'bg-muted/50 border-2 border-transparent'
                        }`}
                        onClick={() => setNewIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addHabit} disabled={!newName.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Hábito
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1.5">
          {habits.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhum hábito criado ainda
              </CardContent>
            </Card>
          ) : (
            habits.map(habit => {
              const isCompleted = habit.completedDates.includes(today);
              const streak = getStreak(habit);
              return (
                <Card key={habit.id} className={`border-border/40 transition-all ${isCompleted ? 'bg-emerald-500/5' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-muted/50 border border-transparent'
                        }`}
                        onClick={() => toggleHabit(habit.id)}
                      >
                        {isCompleted ? <Check className="h-5 w-5 text-emerald-400" /> : <span>{habit.icon}</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-400' : ''}`}>{habit.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {streak > 0 && (
                            <Badge variant="secondary" className="text-[9px] text-orange-400 bg-orange-500/10">
                              🔥 {streak} dias
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Melhor: {getBestStreak(habit)} dias
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteHabit(habit.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Monthly Heatmap */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                ←
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[9px] text-muted-foreground font-medium py-1">
                {d}
              </div>
            ))}
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(day, month, year);
              const isToday = dateStr === today;
              const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
              const intensity = habits.length > 0 ? completedCount / habits.length : 0;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-sm flex items-center justify-center text-[9px] transition-all ${
                    isToday
                      ? 'ring-1 ring-violet-500 font-bold'
                      : ''
                  } ${completedCount > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}
                  style={{
                    backgroundColor: intensity > 0
                      ? `rgba(139, 92, 246, ${Math.max(0.1, intensity * 0.8)})`
                      : 'var(--muted)',
                  }}
                  title={`${day}: ${completedCount}/${habits.length} hábitos`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[8px] text-muted-foreground">Menos</span>
            {[0.1, 0.3, 0.5, 0.8].map((intensity, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: `rgba(139, 92, 246, ${intensity})` }}
              />
            ))}
            <span className="text-[8px] text-muted-foreground">Mais</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
