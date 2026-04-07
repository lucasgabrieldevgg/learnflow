'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Save,
  BookOpen,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { sendMessageWithFallback, type AIMessage } from '@/lib/ai-provider';
import {
  generateId,
  getFeynmanExplanations,
  setFeynmanExplanations,
  addXP,
  type FeynmanExplanation,
} from '@/lib/storage';

type FeynmanStep = 'concept' | 'ai-explain' | 'user-explain' | 'gaps' | 'refined' | 'done';

const STEPS: { id: FeynmanStep; label: string; num: number }[] = [
  { id: 'concept', label: 'Conceito', num: 1 },
  { id: 'ai-explain', label: 'IA Explica', num: 2 },
  { id: 'user-explain', label: 'Sua Explicação', num: 3 },
  { id: 'gaps', label: 'Lacunas', num: 4 },
  { id: 'refined', label: 'Explicação Refinada', num: 5 },
  { id: 'done', label: 'Concluído', num: 6 },
];

export default function FeynmanExplainer() {
  const [step, setStep] = useState<FeynmanStep>('concept');
  const [concept, setConcept] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [userExplanation, setUserExplanation] = useState('');
  const [gaps, setGaps] = useState('');
  const [refinedExplanation, setRefinedExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedExplanations, setSavedExplanations] = useState<FeynmanExplanation[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = () => {
    setSavedExplanations(getFeynmanExplanations());
    setShowHistory(!showHistory);
  };

  const getStepIndex = () => STEPS.findIndex(s => s.id === step);

  const generateAIExplanation = async () => {
    if (!concept.trim()) return;
    setIsLoading(true);
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: 'Você é um especialista em simplificar conceitos complexos. Explique de forma simples, como se estivesse ensinando a uma criança de 12 anos. Use analogias do dia a dia brasileiro. Seja claro e conciso. Responda em português.'
        },
        {
          role: 'user',
          content: `Explique de forma muito simples o conceito de "${concept}". Use linguagem acessível, analogias do dia a dia e exemplos concretos. Organize a explicação em tópicos curtos.`
        }
      ];
      const response = await sendMessageWithFallback(messages);
      setAiExplanation(response.content);
      setStep('ai-explain');
      addXP(15);
    } catch {
      alert('Erro ao gerar explicação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeGaps = async () => {
    if (!userExplanation.trim()) return;
    setIsLoading(true);
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: 'Você é um professor que analisa explicações de alunos. Identifique lacunas de entendimento de forma construtiva e gentil. Responda em português.'
        },
        {
          role: 'user',
          content: `O conceito é "${concept}".

Minha explicação oficial simplificada:
${aiExplanation}

A explicação do aluno:
${userExplanation}

Analise a explicação do aluno. Identifique:
1. O que ele acertou (seja encorajador!)
2. Lacunas ou equívocos
3. Sugestões de melhoria
4. Conceitos que ele deveria revisar

Seja construtivo e gentil.`
        }
      ];
      const response = await sendMessageWithFallback(messages);
      setGaps(response.content);
      setStep('gaps');
      addXP(25);
    } catch {
      alert('Erro ao analisar. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRefinedExplanation = async () => {
    setIsLoading(true);
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: 'Você é um especialista em simplificação. Crie uma explicação refinada e completa que preenche as lacunas identificadas. Use linguagem simples, analogias e exemplos. Responda em português.'
        },
        {
          role: 'user',
          content: `Conceito: "${concept}"

Explicação inicial da IA:
${aiExplanation}

Explicação do aluno:
${userExplanation}

Lacunas identificadas:
${gaps}

Crie uma explicação REFINADA que:
1. Combine o melhor da explicação original
2. Corrija as lacunas identificadas
3. Use analogias novas e simples
4. Seja completa mas fácil de entender
5. Como se ensinasse para alguém de 12 anos`
        }
      ];
      const response = await sendMessageWithFallback(messages);
      setRefinedExplanation(response.content);
      setStep('refined');
      addXP(30);

      // Auto save
      const explanation: FeynmanExplanation = {
        id: generateId(),
        concept,
        aiExplanation,
        userExplanation,
        gaps,
        refinedExplanation: response.content,
        createdAt: Date.now(),
      };
      const explanations = getFeynmanExplanations();
      explanations.push(explanation);
      setFeynmanExplanations(explanations);
    } catch {
      alert('Erro ao gerar explicação refinada. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const restart = () => {
    setStep('concept');
    setConcept('');
    setAiExplanation('');
    setUserExplanation('');
    setGaps('');
    setRefinedExplanation('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">🧠 Explicador Feynman</h2>
        <p className="text-xs text-muted-foreground">Entenda qualquer conceito profundamente</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
              getStepIndex() >= i
                ? 'bg-violet-500/20 text-violet-400'
                : 'bg-muted/50 text-muted-foreground'
            }`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] ${
                getStepIndex() > i
                  ? 'bg-violet-500 text-white'
                  : getStepIndex() === i
                  ? 'bg-violet-500/30 text-violet-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getStepIndex() > i ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 min-w-4 ${getStepIndex() > i ? 'bg-violet-500/50' : 'bg-muted/50'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Concept */}
      {step === 'concept' && (
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Qual conceito você quer entender?</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Escolha qualquer conceito que você queira aprender profundamente.
            </p>
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ex: Gravidade, Fotossíntese, Inflação..."
              className="h-10"
              onKeyDown={(e) => e.key === 'Enter' && generateAIExplanation()}
            />
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              onClick={generateAIExplanation}
              disabled={!concept.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              Explicar com IA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Explanation */}
      {step === 'ai-explain' && (
        <div className="space-y-3">
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold">Explicação da IA</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Leia esta explicação simples do conceito de &ldquo;{concept}&rdquo;:
              </p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiExplanation}</div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                📖 Agora tente explicar este conceito com suas próprias palavras, como se estivesse ensinando a alguém. Esse é o coração da Técnica Feynman!
              </p>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={() => setStep('user-explain')}>
            Escrever minha explicação
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3: User Explanation */}
      {step === 'user-explain' && (
        <div className="space-y-3">
          <Card className="border-border/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold">Sua Explicação</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Explique &ldquo;{concept}&rdquo; com suas próprias palavras. Imagine que está ensinando a uma criança de 12 anos!
              </p>
              <Textarea
                value={userExplanation}
                onChange={(e) => setUserExplanation(e.target.value)}
                placeholder="Escreva sua explicação aqui..."
                className="min-h-[200px] text-sm"
              />
              <Button
                className="w-full"
                onClick={analyzeGaps}
                disabled={!userExplanation.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                Analisar minhas lacunas
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Gaps */}
      {step === 'gaps' && (
        <div className="space-y-3">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold">Análise das Lacunas</h3>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{gaps}</div>
            </CardContent>
          </Card>

          <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600" onClick={generateRefinedExplanation} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar Explicação Refinada
          </Button>
        </div>
      )}

      {/* Step 5: Refined Explanation */}
      {step === 'refined' && (
        <div className="space-y-3">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold">Explicação Refinada</h3>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{refinedExplanation}</div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                🎉 Parabéns! Você usou a Técnica Feynman para entender &ldquo;{concept}&rdquo; profundamente. A explicação foi salva automaticamente!
              </p>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={restart}>
            <Sparkles className="h-4 w-4 mr-2" />
            Explorar Outro Conceito
          </Button>
        </div>
      )}

      {/* History */}
      <Button variant="outline" className="w-full text-xs" onClick={loadHistory}>
        📚 {showHistory ? 'Esconder' : 'Ver'} Explicações Salvas ({getFeynmanExplanations().length})
      </Button>

      {showHistory && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {savedExplanations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma explicação salva ainda</p>
          ) : (
            savedExplanations.slice().reverse().map((exp) => (
              <Card key={exp.id} className="border-border/40">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <p className="text-sm font-medium">{exp.concept}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(exp.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
