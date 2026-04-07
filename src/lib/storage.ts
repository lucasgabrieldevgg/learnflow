// localStorage utilities for the learning platform

const PREFIX = 'learnflow_';

function getKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(getKey(key));
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getKey(key));
}

// ---- Chat History ----
export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function getChatHistory(): ChatMessage[] {
  return getStorage<ChatMessage[]>('chat_history', []);
}

export function setChatHistory(messages: ChatMessage[]): void {
  setStorage('chat_history', messages);
}

export function addChatMessage(message: ChatMessage): void {
  const history = getChatHistory();
  history.push(message);
  setChatHistory(history);
}

export function clearChatHistory(): void {
  setStorage('chat_history', []);
}

// ---- Flashcards ----
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  interval: number; // days until next review
  easeFactor: number; // SM-2 ease factor
  nextReview: number; // timestamp
  repetitions: number;
}

export interface Deck {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export function getDecks(): Deck[] {
  return getStorage<Deck[]>('decks', []);
}

export function setDecks(decks: Deck[]): void {
  setStorage('decks', decks);
}

export function getFlashcards(): Flashcard[] {
  return getStorage<Flashcard[]>('flashcards', []);
}

export function setFlashcards(cards: Flashcard[]): void {
  setStorage('flashcards', cards);
}

// ---- Cornell Notes ----
export interface CornellNote {
  id: string;
  title: string;
  cues: string;
  notes: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
}

export function getCornellNotes(): CornellNote[] {
  return getStorage<CornellNote[]>('cornell_notes', []);
}

export function setCornellNotes(notes: CornellNote[]): void {
  setStorage('cornell_notes', notes);
}

// ---- Quiz Results ----
export interface QuizResult {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  timestamp: number;
}

export function getQuizResults(): QuizResult[] {
  return getStorage<QuizResult[]>('quiz_results', []);
}

export function setQuizResults(results: QuizResult[]): void {
  setStorage('quiz_results', results);
}

// ---- Study Sessions ----
export interface StudySession {
  id: string;
  subject: string;
  topic: string;
  duration: number; // minutes
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  completed: boolean;
  color: string;
}

export function getStudySessions(): StudySession[] {
  return getStorage<StudySession[]>('study_sessions', []);
}

export function setStudySessions(sessions: StudySession[]): void {
  setStorage('study_sessions', sessions);
}

// ---- Habits ----
export interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[]; // YYYY-MM-DD format
  createdAt: number;
}

export function getHabits(): Habit[] {
  return getStorage<Habit[]>('habits', []);
}

export function setHabits(habits: Habit[]): void {
  setStorage('habits', habits);
}

// ---- Progress / Gamification ----
export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  lastStudyDate: string;
  totalStudyMinutes: number;
  pomodoroSessionsToday: number;
  pomodoroSessionsTotal: number;
  flashcardsReviewed: number;
  quizzesTaken: number;
  achievements: string[];
  weeklyActivity: Record<string, number>; // date -> minutes
}

export function getProgress(): UserProgress {
  return getStorage<UserProgress>('progress', {
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastStudyDate: '',
    totalStudyMinutes: 0,
    pomodoroSessionsToday: 0,
    pomodoroSessionsTotal: 0,
    flashcardsReviewed: 0,
    quizzesTaken: 0,
    achievements: [],
    weeklyActivity: {},
  });
}

export function setProgress(progress: UserProgress): void {
  setStorage('progress', progress);
}

export function addXP(amount: number): UserProgress {
  const progress = getProgress();
  progress.xp += amount;
  const newLevel = Math.floor(progress.xp / 1000) + 1;
  if (newLevel > progress.level) {
    progress.level = newLevel;
  }
  updateStreak(progress);
  setProgress(progress);
  return progress;
}

function updateStreak(progress: UserProgress): void {
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastStudyDate === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (progress.lastStudyDate === yesterday) {
    progress.streak += 1;
  } else if (progress.lastStudyDate !== today) {
    progress.streak = 1;
  }
  progress.lastStudyDate = today;
  if (progress.streak > progress.bestStreak) {
    progress.bestStreak = progress.streak;
  }
}

// ---- Feynman Explanations ----
export interface FeynmanExplanation {
  id: string;
  concept: string;
  aiExplanation: string;
  userExplanation: string;
  gaps: string;
  refinedExplanation: string;
  createdAt: number;
}

export function getFeynmanExplanations(): FeynmanExplanation[] {
  return getStorage<FeynmanExplanation[]>('feynman_explanations', []);
}

export function setFeynmanExplanations(explanations: FeynmanExplanation[]): void {
  setStorage('feynman_explanations', explanations);
}

// ---- Pomodoro Stats ----
export interface PomodoroStats {
  todaySessions: number;
  todayMinutes: number;
  weekSessions: number;
  lastDate: string;
}

export function getPomodoroStats(): PomodoroStats {
  return getStorage<PomodoroStats>('pomodoro_stats', {
    todaySessions: 0,
    todayMinutes: 0,
    weekSessions: 0,
    lastDate: '',
  });
}

export function setPomodoroStats(stats: PomodoroStats): void {
  setStorage('pomodoro_stats', stats);
}

// ---- User Profile ----
export interface LearnedTopic {
  topic: string;
  date: string;
  xpEarned: number;
}

export interface UserProfile {
  id: string;           // LF-XXXXX
  name: string;
  goal: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  assessmentTopic: string;
  createdAt: number;
  learnedTopics: LearnedTopic[];
}

function generateUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LF-${code}`;
}

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  name: '',
  goal: '',
  level: 'iniciante',
  assessmentTopic: '',
  createdAt: 0,
  learnedTopics: [],
};

export function getUserProfile(): UserProfile {
  return getStorage<UserProfile>('user_profile', { ...DEFAULT_PROFILE });
}

export function setUserProfile(profile: UserProfile): void {
  setStorage('user_profile', profile);
}

export function createNewProfile(name: string, goal: string, level: 'iniciante' | 'intermediario' | 'avancado', assessmentTopic: string): UserProfile {
  const profile: UserProfile = {
    id: generateUserId(),
    name: name || 'Aprendiz',
    goal,
    level,
    assessmentTopic,
    createdAt: Date.now(),
    learnedTopics: [],
  };
  setUserProfile(profile);
  // Also set onboarding done
  setStorage('onboarding_done', true);
  return profile;
}

export function addLearnedTopic(topic: string, xpEarned: number): UserProfile {
  const profile = getUserProfile();
  // Avoid duplicates
  if (profile.learnedTopics.some(t => t.topic.toLowerCase() === topic.toLowerCase())) {
    return profile;
  }
  profile.learnedTopics.push({
    topic,
    date: new Date().toISOString().split('T')[0],
    xpEarned,
  });
  setUserProfile(profile);
  return profile;
}

export function isOnboardingDone(): boolean {
  return getStorage<boolean>('onboarding_done', false);
}

// ---- Data Export / Import ----
export function exportAllData(): string {
  if (typeof window === 'undefined') return '{}';
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(data: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed !== 'object' || parsed === null) return false;
    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Helper to generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper to get today's date as YYYY-MM-DD
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Colors for decks/subjects
export const COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];
