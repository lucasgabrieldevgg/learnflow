'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  CalendarDays,
  Clock,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Target,
} from 'lucide-react';
import {
  getStudySessions,
  setStudySessions,
  generateId,
  getToday,
  COLORS,
  addXP,
  getProgress,
  setProgress,
  type StudySession,
} from '@/lib/storage';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function StudyPlanner() {
  const [sessions, setSessionsState] = useState<StudySession[]>(() => getStudySessions());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Form
  const [formSubject, setFormSubject] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formTime, setFormTime] = useState('10:00');
  const [formColor, setFormColor] = useState(COLORS[0]);

  const refresh = () => setSessionsState(getStudySessions());

  const addSession = () => {
    if (!formSubject.trim() || !formTopic.trim()) return;
    const session: StudySession = {
      id: generateId(),
      subject: formSubject.trim(),
      topic: formTopic.trim(),
      duration: parseInt(formDuration) || 60,
      date: getToday(),
      time: formTime,
      completed: false,
      color: formColor,
    };
    const updated = [...sessions, session];
    setSessionsState(updated);
    setStudySessions(updated);
    setShowAdd(false);
    setFormSubject('');
    setFormTopic('');
  };

  const toggleComplete = (id: string) => {
    const updated = sessions.map(s =>
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    setSessionsState(updated);
    setStudySessions(updated);

    const session = updated.find(s => s.id === id);
    if (session?.completed) {
      addXP(30);
      const p = getProgress();
      p.totalStudyMinutes += session.duration;
      setProgress(p);
    }
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessionsState(updated);
    setStudySessions(updated);
  };

  // Week calculation
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const today = getToday();
  const todaySessions = sessions.filter(s => s.date === today);
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date);
    return weekDays.some(wd => wd.toDateString() === d.toDateString());
  });

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">📋 Planejador de Estudos</h2>
        <p className="text-xs text-muted-foreground">Organize suas sessões de estudo na semana</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {MONTHS[weekDays[0].getMonth()]} {weekDays[0].getDate()} - {MONTHS[weekDays[6].getMonth()]} {weekDays[6].getDate()}, {weekDays[6].getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const dateStr = day.toISOString().split('T')[0];
          const daySessions = sessions.filter(s => s.date === dateStr);
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className={`rounded-lg border p-2 min-h-[80px] transition-all ${
                isToday
                  ? 'border-violet-500/50 bg-violet-500/5'
                  : 'border-border/30 bg-card/50'
              }`}
            >
              <div className="text-center mb-1">
                <span className="text-[10px] text-muted-foreground">{DAYS[day.getDay()]}</span>
                <p className={`text-sm font-semibold ${isToday ? 'text-violet-400' : ''}`}>{day.getDate()}</p>
              </div>
              <div className="space-y-0.5">
                {daySessions.slice(0, 3).map(s => (
                  <div
                    key={s.id}
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                    title={`${s.subject}: ${s.topic}`}
                  />
                ))}
                {daySessions.length > 3 && (
                  <p className="text-[8px] text-muted-foreground text-center">+{daySessions.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Session */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão de Estudo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sessão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Matéria</Label>
              <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Ex: Matemática" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tópico</Label>
              <Input value={formTopic} onChange={(e) => setFormTopic(e.target.value)} placeholder="Ex: Equações do 2° grau" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Duração (min)</Label>
                <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} min={5} max={480} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horário</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.slice(0, 8).map(c => (
                  <button
                    key={c}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${formColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addSession} disabled={!formSubject.trim() || !formTopic.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Today's Sessions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-violet-400" />
            Sessões de Hoje
            {todaySessions.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{todaySessions.length}</Badge>
            )}
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {todaySessions.filter(s => s.completed).length}/{todaySessions.length} feitas
          </Badge>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todaySessions.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhuma sessão planejada para hoje
              </CardContent>
            </Card>
          ) : (
            todaySessions.map(s => (
              <Card key={s.id} className={`border-border/40 ${s.completed ? 'opacity-60' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <button
                      className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        s.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30'
                      }`}
                      onClick={() => toggleComplete(s.id)}
                    >
                      {s.completed && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <p className={`text-sm font-medium ${s.completed ? 'line-through' : ''}`}>{s.subject}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.topic}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{s.duration}min
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          🕐 {s.time}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteSession(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Week Stats */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">📊 Resumo da Semana</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-violet-400">{weekSessions.length}</p>
              <p className="text-[10px] text-muted-foreground">Sessões</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">
                {weekSessions.filter(s => s.completed).length}
              </p>
              <p className="text-[10px] text-muted-foreground">Completas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">
                {weekSessions.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0)}min
              </p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
