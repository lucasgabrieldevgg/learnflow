'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  WifiOff,
  Zap,
  Send,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { sendMessageWithFallback, type AIMessage } from '@/lib/ai-provider';
import { createNewProfile, getUserProfile, addXP } from '@/lib/storage';

interface OnboardingProps {
  onComplete: () => void;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
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

const levelDesc: Record<string, string> = {
  iniciante: 'Vou te ensinar do absoluto zero, passo a passo. Sem pressa!',
  intermediario: 'Você já tem uma base! Vou aprofundar e preencher lacunas.',
  avancado: 'Vamos direto pro negócio! Foco em refinamento e desafios.',
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [detectedLevel, setDetectedLevel] = useState('');
  const [detectedLevelReason, setDetectedLevelReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Conversational assessment state
  const [assessmentMessages, setAssessmentMessages] = useState<ChatMsg[]>([]);
  const [assessmentInput, setAssessmentInput] = useState('');
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(0);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 5;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const goal = customGoal || goalOptions.find(g => g.id === selectedGoal)?.label || '';

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assessmentMessages]);

  const startConversationalAssessment = useCallback(async (topic: string) => {
    setIsLoading(true);
    setApiError(false);

    const systemPrompt = `Você é um avaliador educacional que descobre o nível REAL do aluno através de CONVERSA, não de quiz.

REGRAS IMPORTANTES:
- Converse naturalmente, como um professor carinhoso
- Faça UMA pergunta por vez — espere o aluno responder
- Comece perguntando o que ele já sabe sobre ${topic}
- Adapte a dificuldade da próxima pergunta baseada na resposta dele
- Se ele errar algo fácil, pergunte algo mais fácil ainda
- Se ele acertar algo difícil, tente algo mais avançado
- Máximo de 4 perguntas
- Use linguagem simples e amigável
- Depois da 4ª resposta do aluno, diga EXATAMENTE: "[NÍVEL: iniciante/intermediario/avancado] [MOTIVO: explicação de por quê]"

NUNCA use formato de quiz com A/B/C/D. Converse!

Exemplo de conversa:
IA: "E aí! Me conta, o que você já sabe sobre ${topic}? Pode ser de qualquer nível — até se nunca teve contato."
Aluno: "sei nada"
IA: "Tranquilo! Sabe aquela coisa básica sobre [conceito simples]?"
...`;

    try {
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Comece a conversa para avaliar o nível do aluno em ${topic}. Lembre: converse, não faça quiz.` },
      ];

      const response = await sendMessageWithFallback(messages);
      setAssessmentMessages([{ role: 'assistant', content: response.content }]);
      setStep(3);
    } catch (error) {
      console.error('Assessment error:', error);
      setApiError(true);
      // Fallback: simple self-assessment
      setDetectedLevel('iniciante');
      setDetectedLevelReason('IA indisponível — começando do básico para garantir.');
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendAssessmentMessage = useCallback(async () => {
    const text = assessmentInput.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = { role: 'user', content: text };
    const newMessages = [...assessmentMessages, userMsg];
    setAssessmentMessages(newMessages);
    setAssessmentInput('');
    setIsLoading(true);

    const newCount = assessmentQuestionCount + 1;
    setAssessmentQuestionCount(newCount);

    try {
      const systemPrompt = `Você é um avaliador que descobre o nível do aluno por conversa. Já conversou ${newCount} vez(es) com ele.

REGRAS:
- Continue a conversa naturalmente
- Faça UMA pergunta por vez
- Adapte a dificuldade baseada nas respostas anteriores
- Use linguagem simples e amigável

${newCount >= 3 ? `IMPORTANTE: Esta é a ${newCount}ª interação. Após responder, termine DIZENDO EXATAMENTE esta linha no final:
[NÍVEL: iniciante/intermediario/avancado]
[MOTIVO: explicação curta de por quê]` : ''}`;

      const apiMessages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const response = await sendMessageWithFallback(apiMessages);
      const assistantMsg: ChatMsg = { role: 'assistant', content: response.content };
      const allMessages = [...newMessages, assistantMsg];
      setAssessmentMessages(allMessages);

      // Check if AI provided level assessment
      const levelMatch = response.content.match(/\[NÍVEL:\s*(iniciante|intermediario|avancado)\]/i);
      const motivoMatch = response.content.match(/\[MOTIVO:\s*(.*?)\]/i);

      if (levelMatch) {
        const level = levelMatch[1].toLowerCase() === 'avancado' ? 'avancado' : levelMatch[1].toLowerCase();
        setDetectedLevel(level);
        setDetectedLevelReason(motivoMatch?.[1] || 'Baseado na conversa.');
        setAssessmentDone(true);
        addXP(50);

        // Auto-advance after a short delay
        setTimeout(() => {
          setStep(4);
        }, 2000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMsg = {
        role: 'assistant',
        content: '⚠️ Tive um probleminha de conexão. Mas não se preocupa! Vou considerar você como iniciante e te ensinar tudo do zero. Pode confiar! 😊',
      };
      setAssessmentMessages(prev => [...prev, errorMsg]);
      setDetectedLevel('iniciante');
      setDetectedLevelReason('Erro de conexão — começando do zero para garantir.');
      setTimeout(() => setStep(4), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [assessmentInput, assessmentMessages, isLoading, assessmentQuestionCount]);

  const handleGoalSelect = () => {
    if (!goal) return;
    startConversationalAssessment(goal);
  };

  const handleFinish = () => {
    createNewProfile(name, goal, detectedLevel as 'iniciante' | 'intermediario' | 'avancado', goal);
    addXP(100);
    onComplete();
  };

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
              Vou descobrir como você aprende e personalizar tudo pra você.
              Sem quiz chato — vamos conversar! 😄
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
                <MessageCircle className="h-3 w-3 text-emerald-400" />
                Avaliação por conversa — a IA descobre seu nível naturalmente
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
              <p className="text-xs text-muted-foreground">Opcional — pode mudar depois</p>
            </div>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome (ou apelido)"
              className="h-12 text-center text-base"
              maxLength={30}
              onKeyDown={(e) => { if (e.key === 'Enter') setStep(2); }}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500" onClick={() => setStep(2)}>
                Próximo <ArrowRight className="h-4 w-4 ml-2" />
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
              <p className="text-xs text-muted-foreground">Escolha ou digite</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {goalOptions.map((g, i) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <motion.button
                    key={g.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { setSelectedGoal(g.id); setCustomGoal(''); }}
                    className={`rounded-xl border p-4 text-center transition-all duration-200 ${
                      isSelected
                        ? 'border-violet-500/50 bg-violet-500/10 shadow-md shadow-violet-500/10'
                        : 'border-border/40 bg-card/50 hover:border-violet-500/30 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <p className="text-sm font-medium mt-1">{g.label}</p>
                  </motion.button>
                );
              })}
            </div>

            <Input
              value={customGoal}
              onChange={(e) => { setCustomGoal(e.target.value); setSelectedGoal(''); }}
              placeholder="Ou digite outro tema..."
              className="h-11"
              maxLength={50}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                onClick={handleGoalSelect}
                disabled={!selectedGoal && !customGoal}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Conversando...</>
                ) : (
                  <>Conversar com IA <MessageCircle className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Conversational Assessment */}
        {step === 3 && (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md flex flex-col h-[500px]"
          >
            <div className="text-center space-y-1 mb-3">
              <h2 className="text-lg font-bold flex items-center justify-center gap-2">
                <Brain className="h-5 w-5 text-violet-400" />
                Vamos Conversar!
              </h2>
              <p className="text-xs text-muted-foreground">
                A IA vai descobrir seu nível através de uma conversa natural
                {assessmentQuestionCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-violet-500/20 text-violet-400 border-0">
                    {assessmentQuestionCount}/3
                  </Badge>
                )}
              </p>
            </div>

            {apiError && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center mb-2">
                <p className="text-xs text-amber-400 flex items-center justify-center gap-1.5">
                  <WifiOff className="h-3 w-3" />
                  IA indisponível — começando do básico.
                </p>
              </div>
            )}

            {/* Chat messages */}
            <Card className="flex-1 border-border/40 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {assessmentMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-tr-sm'
                        : 'bg-muted/80 rounded-tl-sm'
                    }`}>
                      {msg.content.split('\n').map((line, j) => {
                        let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        // Hide the [NÍVEL: ...] and [MOTIVO: ...] tags from display
                        processed = processed.replace(/\[NÍVEL:.*?\]/gi, '');
                        processed = processed.replace(/\[MOTIVO:.*?\]/gi, '');
                        if (!processed.trim()) return null;
                        return <p key={j} dangerouslySetInnerHTML={{ __html: processed }} />;
                      })}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-muted/80 px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-violet-400 typing-dot" />
                        <div className="h-2 w-2 rounded-full bg-violet-400 typing-dot" />
                        <div className="h-2 w-2 rounded-full bg-violet-400 typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                {assessmentDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400">Nível detectado! Redirecionando...</p>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {!assessmentDone && (
                <div className="border-t border-border/50 p-3">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={assessmentInput}
                      onChange={(e) => setAssessmentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendAssessmentMessage(); }}
                      placeholder="Digite sua resposta..."
                      className="h-10 text-sm"
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                      onClick={sendAssessmentMessage}
                      disabled={!assessmentInput.trim() || isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                    Seja honesto! Não tem resposta certa ou errada — é pra gente descobrir seu nível juntos 😊
                  </p>
                </div>
              )}
            </Card>
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
                Tudo pronto! 🎉
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
                    <p className="text-sm text-muted-foreground">Seu Nível</p>
                    <p className="text-xl font-bold">{levelLabels[detectedLevel]}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {levelDesc[detectedLevel]}
                  </p>
                </CardContent>
              </Card>

              {detectedLevelReason && (
                <Card className="border-border/40">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed text-center">
                      💡 {detectedLevelReason}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/40">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{name || 'Aprendiz'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Objetivo</span>
                    <span className="font-medium">{goal}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    O Tutor IA vai te ensinar do SEU nível. Se não entender algo, é só falar que ele explica de outro jeito! 💪
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
