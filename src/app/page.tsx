'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Sidebar, { type ViewId, ThemeToggle } from '@/components/platform/sidebar';
import Onboarding from '@/components/platform/onboarding';
import Settings from '@/components/platform/settings';
import Dashboard from '@/components/platform/dashboard';
import AITutor from '@/components/platform/ai-tutor';
import PomodoroTimer from '@/components/platform/pomodoro-timer';
import Flashcards from '@/components/platform/flashcards';
import CornellNotes from '@/components/platform/cornell-notes';
import QuizGenerator from '@/components/platform/quiz-generator';
import FeynmanExplainer from '@/components/platform/feynman-explainer';
import StudyPlanner from '@/components/platform/study-planner';
import BreathingExercise from '@/components/platform/breathing-exercise';
import FocusSounds from '@/components/platform/focus-sounds';
import HabitTracker from '@/components/platform/habit-tracker';
import ProgressDashboard from '@/components/platform/progress-dashboard';
import { isOnboardingDone } from '@/lib/storage';

const viewComponents: Record<string, React.ComponentType<{ onNavigate?: (view: ViewId) => void }>> = {
  dashboard: Dashboard,
  'ai-tutor': AITutor,
  pomodoro: PomodoroTimer,
  flashcards: Flashcards,
  'cornell-notes': CornellNotes,
  quiz: QuizGenerator,
  feynman: FeynmanExplainer,
  planner: StudyPlanner,
  breathing: BreathingExercise,
  'focus-sounds': FocusSounds,
  habits: HabitTracker,
  progress: ProgressDashboard,
  settings: Settings,
};

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check onboarding status on mount - use callback pattern to avoid direct setState in effect
  useEffect(() => {
    const done = isOnboardingDone();
    // Schedule state updates after mount via timeout to avoid cascading render lint
    const t = requestAnimationFrame(() => {
      setMounted(true);
      if (!done) {
        setShowOnboarding(true);
      }
    });
    return () => cancelAnimationFrame(t);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setActiveView('ai-tutor');
  };

  const ActiveComponent = viewComponents[activeView];

  const handleNavigate = (view: ViewId) => {
    setActiveView(view);
  };

  // Don't render until we know the onboarding status
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30">
            <svg className="h-8 w-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 bg-card/50 backdrop-blur-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              LearnFlow
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {ActiveComponent && (
                <div className="h-full overflow-y-auto">
                  <ActiveComponent onNavigate={handleNavigate} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile bottom nav */}
        <nav className="flex items-center justify-around border-t border-border/50 bg-card/95 backdrop-blur-xl py-1 lg:hidden">
          {[
            { id: 'dashboard' as ViewId, emoji: '🏠', label: 'Home' },
            { id: 'ai-tutor' as ViewId, emoji: '🤖', label: 'IA' },
            { id: 'pomodoro' as ViewId, emoji: '🍅', label: 'Timer' },
            { id: 'flashcards' as ViewId, emoji: '🃏', label: 'Cards' },
            { id: 'progress' as ViewId, emoji: '📊', label: 'Stats' },
          ].map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-all ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-muted-foreground'
                }`}
              >
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
