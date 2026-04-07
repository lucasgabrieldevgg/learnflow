'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Timer,
  Layers,
  StickyNote,
  HelpCircle,
  Brain,
  CalendarDays,
  Wind,
  Music,
  CheckSquare,
  BarChart3,
  Sun,
  Moon,
  X,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Wrench,
  HeartPulse,
  LayoutDashboard,
} from 'lucide-react';

export type ViewId =
  | 'dashboard'
  | 'ai-tutor'
  | 'pomodoro'
  | 'flashcards'
  | 'cornell-notes'
  | 'quiz'
  | 'feynman'
  | 'planner'
  | 'breathing'
  | 'focus-sounds'
  | 'habits'
  | 'progress'
  | 'settings'
  | 'onboarding';

interface NavItem {
  id: ViewId;
  label: string;
  emoji: string;
}

interface ToolGroup {
  name: string;
  icon: React.ElementType;
  items: NavItem[];
}

const toolGroups: ToolGroup[] = [
  {
    name: 'Estudo',
    icon: BookOpen,
    items: [
      { id: 'pomodoro', label: 'Pomodoro', emoji: '🍅' },
      { id: 'flashcards', label: 'Flashcards', emoji: '🃏' },
      { id: 'cornell-notes', label: 'Notas Cornell', emoji: '📝' },
      { id: 'quiz', label: 'Quiz IA', emoji: '❓' },
      { id: 'feynman', label: 'Feynman', emoji: '🧠' },
    ],
  },
  {
    name: 'Organização',
    icon: Wrench,
    items: [
      { id: 'planner', label: 'Planejador', emoji: '📋' },
      { id: 'habits', label: 'Hábitos', emoji: '✅' },
    ],
  },
  {
    name: 'Bem-estar',
    icon: HeartPulse,
    items: [
      { id: 'breathing', label: 'Respiração', emoji: '🫁' },
      { id: 'focus-sounds', label: 'Sons Foco', emoji: '🎵' },
    ],
  },
];

export interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  open: boolean;
  onClose: () => void;
}

function ThemeToggle() {
  const [dark, setDark] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      onClick={toggle}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function Sidebar({ activeView, onViewChange, open, onClose }: SidebarProps) {
  const [toolsExpanded, setToolsExpanded] = useState(true);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border/50 bg-card/95 backdrop-blur-xl transition-transform duration-300 lg:relative lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg shadow-lg shadow-violet-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                LearnFlow
              </h1>
              <p className="text-[10px] text-muted-foreground">Aprenda qualquer coisa</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="opacity-50" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="space-y-1">
            {/* Dashboard */}
            <button
              onClick={() => {
                onViewChange('dashboard');
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                activeView === 'dashboard'
                  ? 'bg-muted/50 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">🏠</span>
              <span className="truncate">Dashboard</span>
            </button>

            <div className="my-2" />

            {/* AI Tutor - PRIMARY ENTRY */}
            <button
              onClick={() => {
                onViewChange('ai-tutor');
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 shadow-md ${
                activeView === 'ai-tutor'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-500/30'
                  : 'bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-400 hover:from-violet-600 hover:to-purple-600 hover:text-white'
              }`}
            >
              <span className="text-lg leading-none">🤖</span>
              <div className="flex-1 text-left">
                <span className="truncate block">Tutor IA</span>
                <span className={`text-[10px] font-normal ${activeView === 'ai-tutor' ? 'text-white/70' : 'text-violet-400/70'}`}>
                  Aprenda com IA
                </span>
              </div>
              <Sparkles className="h-3.5 w-3.5" />
            </button>

            <div className="my-2" />

            {/* Tool Groups - Collapsible */}
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
            >
              <span>Ferramentas</span>
              {toolsExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            <AnimatePresence>
              {toolsExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {toolGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.name} className="mb-1">
                        <div className="flex items-center gap-1.5 px-3 py-1">
                          <GroupIcon className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                            {group.name}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const isActive = activeView === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  onViewChange(item.id);
                                  onClose();
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all duration-200 ${
                                  isActive
                                    ? 'bg-violet-500/10 text-violet-400 font-medium'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                              >
                                <span className="text-sm leading-none">{item.emoji}</span>
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="my-2" />
            <Separator className="opacity-30" />
            <div className="my-2" />

            {/* Bottom section */}
            <button
              onClick={() => {
                onViewChange('progress');
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                activeView === 'progress'
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">📊</span>
              <span className="truncate">Progresso</span>
            </button>

            <button
              onClick={() => {
                onViewChange('settings');
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                activeView === 'settings'
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">⚙️</span>
              <span className="truncate">Configurações</span>
            </button>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 p-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}

export { ThemeToggle };
