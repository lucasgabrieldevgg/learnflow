'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  User,
  Target,
  Brain,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Bot,
  Rocket,
  PartyPopper,
  BookOpen,
  Calculator,
  Languages,
  FlaskConical,
  Music,
  Lightbulb,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { sendMessageWithFallback, type AIMessage } from '@/lib/ai-provider';
import { createNewProfile, getUserProfile, addXP } from '@/lib/storage';

interface OnboardingProps {
  onComplete: () => void;
}

const goalOptions = [
  { id: 'programacao', label: 'Programação', emoji: '💻', icon: BookOpen },
  { id: 'matematica', label: 'Matemática', emoji: '📐', icon: Calculator },
  { id: 'ingles', label: 'Inglês', emoji: '🇺🇸', icon: Languages },
  { id: 'ciencias', label: 'Ciências', emoji: '🔬', icon: FlaskConical },
  { id: 'musica', label: 'Música', emoji: '🎵', icon: Music },
  { id: 'outro', label: 'Outro', emoji: '💡', icon: Lightbulb },
];

const levelLabels: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const levelColors: Record<string, string> = {
  iniciante: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  intermediario: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  avancado: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
};

const levelEmojis: Record<string, string> = {
  iniciante: '🌱',
  intermediario: '🌿',
  avancado: '🌳',
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [assessmentQuestions, setAssessmentQuestions] = useState<Array<{ question: string; options: string[]; correct: number }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [detectedLevel, setDetectedLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const totalSteps = 5;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const generateAssessment = useCallback(async (topic: string) => {
    setIsLoading(true);
    setAssessmentError(false);

    try {
      const prompt = `Crie EXATAMENTE 4 perguntas de múltipla escolha sobre ${topic} para avaliar o nível do aluno.
Cada pergunta deve ter 4 opções (A, B, C, D) com apenas UMA correta.
Dificuldade: 2 perguntas FÁCEIS, 1 MÉDIA, 1 DIFÍCIL.

Responda APENAS em formato JSON válido, sem nenhum texto antes ou depois. Use este formato exato:
[
  {
    "question": "texto da pergunta",
    "options": ["opção A", "opção B", "opção C", "opção D"],
    "correct": 0
  }
]
O "correct" é o índice da resposta certa (0 para A, 1 para B, 2 para C, 3 para D).`;

      const messages: AIMessage[] = [
        { role: 'system', content: 'Você é um avaliador educacional. Responda APENAS com JSON válido.' },
        { role: 'user', content: prompt },
      ];

      const response = await sendMessageWithFallback(messages, (event) => {
        if (event.type === 'switching') {
          setApiStatus('checking');
        } else if (event.type === 'success') {
          setApiStatus('online');
        }
      });

      // Extract JSON from response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Formato inválido');

      const questions = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(questions) || questions.length < 3) {
        throw new Error('Perguntas insuficientes');
      }

      setAssessmentQuestions(questions.slice(0, 4));
      setApiStatus('online');
      setStep(3);
    } catch (error) {
      console.error('Assessment error:', error);
      setAssessmentError(true);
      setApiStatus('offline');
      const fallbackQuestions = [
        {
          question: `O que você já sabe sobre ${topic}?`,
          options: ['Nunca estudei', 'Sei o básico', 'Tenho experiência intermediária', 'Sou avançado'],
          correct: 0,
        },
        {
          question: `Como você descreveria seu interesse em ${topic}?`,
          options: ['Curiosidade inicial', 'Quero aprender seriamente', 'Já estudo há algum tempo', 'Quero me aprofundar'],
          correct: 0,
        },
        {
          question: `Qual recurso sobre ${topic} você usaria?`,
          options: ['Tutorial para iniciantes', 'Artigo explicativo', 'Curso intermediário', 'Documentação técnica'],
          correct: 0,
        },
      ];
      setAssessmentQuestions(fallbackQuestions);
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateLevel = (answersList: number[]): string => {
    const correct = answersList.reduce((sum, answer, idx) => {
      return sum + (answer === assessmentQuestions[idx]?.correct ? 1 : 0);
    }, 0);

    const total = answersList.length;
    const percentage = (correct / total) * 100;

    if (percentage <= 40) return 'iniciante';
    if (percentage <= 75) return 'intermediario';
    return 'avancado';
  };

  const handleGoalSelect = () => {
    const goal = customGoal || goalOptions.find(g => g.id === selectedGoal)?.label || '';
    if (!goal) return;
    generateAssessment(goal);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setAnswers(prev => [...prev, index]);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      const level = calculateLevel(answers);
      setDetectedLevel(level);
      addXP(50);
      setStep(4);
    }
  };

  const handleFinish = () => {
    const goal = customGoal || goalOptions.find(g => g.id === selectedGoal)?.label || '';
    createNewProfile(name, goal, detectedLevel as 'iniciante' | 'intermediario' | 'avancado', goal);
    addXP(100);
    onComplete();
  };

  const isCorrect = selectedAnswer !== null && selectedAnswer === assessmentQuestions[currentQuestion]?.correct;
  const isAnswered = selectedAnswer !== null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Passo {step + 1} de {totalSteps}
          </span>
          <span className="text-xs font-medium text-violet-400">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 0: Welcome */}
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30"
            >
              <Sparkles className="h-12 w-12 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"
            >
              Bem-vindo ao LearnFlow!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              Sua plataforma inteligente de aprendizagem com IA.
              Vamos personalizar sua experiência em poucos passos!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-3 py-2"
            >
              {[
                { emoji: '🤖', label: 'Tutor IA' },
                { emoji: '🍅', label: 'Pomodoro' },
                { emoji: '🃏', label: 'Flashcards' },
                { emoji: '📊', label: 'Progresso' },
                { emoji: '❓', label: 'Quizzes' },
                { emoji: '🧠', label: 'Feynman' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="rounded-xl border border-border/40 bg-card/50 p-3 text-center"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="rounded-lg border border-border/30 bg-muted/20 px-4 py-3"
            >
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                <Zap className="h-3 w-3 text-emerald-400" />
                7 APIs de IA com fallback automático — nunca fica sem conexão!
              </p>
            </motion.div>

            <Button
              size="lg"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20 text-base"
              onClick={() => setStep(1)}
            >
              Começar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* STEP 1: Name */}
        {step === 1 && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg"
              >
                <User className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold">Como podemos te chamar?</h2>
              <p className="text-xs text-muted-foreground">Isso é opcional — você pode mudar depois</p>
            </div>

            <div className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome (ou apelido)"
                className="h-12 text-center text-base"
                maxLength={30}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setStep(2);
                }}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setStep(0)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                onClick={() => setStep(2)}
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Goal */}
        {step === 2 && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg"
              >
                <Target className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold">O que você quer aprender?</h2>
              <p className="text-xs text-muted-foreground">Escolha um tema ou digite o seu</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {goalOptions.map((goal, i) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <motion.button
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setSelectedGoal(goal.id);
                      setCustomGoal('');
                    }}
                    className={`rounded-xl border p-4 text-center transition-all duration-200 ${
                      isSelected
                        ? 'border-violet-500/50 bg-violet-500/10 shadow-md shadow-violet-500/10'
                        : 'border-border/40 bg-card/50 hover:border-violet-500/30 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <p className="text-sm font-medium mt-1">{goal.label}</p>
                  </motion.button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Input
                value={customGoal}
                onChange={(e) => {
                  setCustomGoal(e.target.value);
                  setSelectedGoal('');
                }}
                placeholder="Ou digite outro tema..."
                className="h-11"
                maxLength={50}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                onClick={handleGoalSelect}
                disabled={!selectedGoal && !customGoal}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {apiStatus === 'checking' ? 'Conectando IA...' : 'Gerando...'}
                  </>
                ) : (
                  <>
                    Avaliar Nível
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Assessment */}
        {step === 3 && assessmentQuestions.length > 0 && (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg"
              >
                <Brain className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold">Avaliação Rápida</h2>
              <p className="text-xs text-muted-foreground">
                Pergunta {currentQuestion + 1} de {assessmentQuestions.length}
              </p>
            </div>

            <div className="flex gap-1.5">
              {assessmentQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < currentQuestion
                      ? 'bg-emerald-500'
                      : i === currentQuestion
                      ? 'bg-violet-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {assessmentError && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
                <p className="text-xs text-amber-400 flex items-center justify-center gap-1.5">
                  <WifiOff className="h-3 w-3" />
                  IA indisponível. Usando avaliação simplificada.
                </p>
              </div>
            )}

            <Card className="border-border/40">
              <CardContent className="p-5">
                <p className="text-sm font-medium leading-relaxed">
                  {assessmentQuestions[currentQuestion].question}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {assessmentQuestions[currentQuestion].options.map((option, i) => {
                const isThisCorrect = assessmentQuestions[currentQuestion].correct === i;
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSelect(i)}
                    className={`w-full rounded-xl border p-3.5 text-left text-sm transition-all duration-200 flex items-center gap-3 ${
                      isAnswered
                        ? i === selectedAnswer
                          ? isThisCorrect
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-red-500/50 bg-red-500/10'
                          : isThisCorrect
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-border/40 bg-card/50 opacity-50'
                        : 'border-border/40 bg-card/50 hover:border-violet-500/40 hover:bg-violet-500/5'
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isAnswered && i === selectedAnswer && (
                      <CheckCircle2 className={`h-4 w-4 ${isThisCorrect ? 'text-emerald-400' : 'text-red-400'}`} />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                  onClick={handleNextQuestion}
                >
                  {currentQuestion < assessmentQuestions.length - 1 ? (
                    <>
                      Próxima Pergunta
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Ver Resultado
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 4: Ready */}
        {step === 4 && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30"
              >
                <PartyPopper className="h-10 w-10 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold"
              >
                Perfil Criado! 🎉
              </motion.h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Card className={`border bg-gradient-to-br ${levelColors[detectedLevel]}`}>
                <CardContent className="p-5 text-center space-y-3">
                  <span className="text-4xl">{levelEmojis[detectedLevel]}</span>
                  <div>
                    <p className="text-sm text-muted-foreground">Seu Nível Detectado</p>
                    <p className="text-xl font-bold">{levelLabels[detectedLevel]}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{name || 'Aprendiz'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Objetivo</span>
                    <span className="font-medium">{customGoal || goalOptions.find(g => g.id === selectedGoal)?.label}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Tudo pronto! O Tutor IA vai guiar você em cada passo da sua jornada de aprendizagem.
                    Se uma API cair, outras 6 entram automaticamente! 💪
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                size="lg"
                className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20 text-base"
                onClick={handleFinish}
              >
                <Bot className="h-5 w-5 mr-2" />
                Falar com o Tutor IA
                <Rocket className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


