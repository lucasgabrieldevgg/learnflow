'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Check,
  X,
  Trophy,
  RotateCcw,
  Sparkles,
  Brain,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { sendMessageWithFallback, type AIMessage } from '@/lib/ai-provider';
import {
  generateId,
  getQuizResults,
  setQuizResults,
  addXP,
  getProgress,
  setProgress,
  type QuizResult,
} from '@/lib/storage';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function QuizGenerator() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = () => {
    setHistory(getQuizResults());
    setShowHistory(!showHistory);
  };

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    try {
      const diffLabel = difficulty === 'facil' ? 'fácil' : difficulty === 'medio' ? 'médio' : 'difícil';
      const prompt = `Gere um quiz com 5 perguntas de múltipla escolha sobre "${topic}" com nível ${diffLabel}.
Responda SOMENTE em formato JSON válido, sem nenhum texto antes ou depois. Use este formato exato:
[
  {
    "question": "Pergunta aqui?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correct": 0,
    "explanation": "Explicação da resposta correta"
  }
]
O campo "correct" é o índice (0-3) da resposta correta. Responda em português.`;

      const messages: AIMessage[] = [
        { role: 'user', content: prompt }
      ];
      const response = await sendMessageWithFallback(messages);
      const content = response.content;

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as QuizQuestion[];
        setQuestions(parsed);
        setQuizStarted(true);
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuizComplete(false);
        setScore(0);
      } else {
        throw new Error('Formato inválido');
      }
    } catch (error) {
      alert('Erro ao gerar quiz. Verifique sua conexão e tente novamente!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === questions[currentQ].correct) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz complete
      setQuizComplete(true);
      const finalScore = score + (selectedAnswer === questions[currentQ]?.correct ? 0 : 0);
      const result: QuizResult = {
        id: generateId(),
        topic,
        difficulty,
        score,
        total: questions.length,
        timestamp: Date.now(),
      };
      const results = getQuizResults();
      results.push(result);
      setQuizResults(results);
      addXP(score * 20);
      const p = getProgress();
      p.quizzesTaken++;
      setProgress(p);
    }
  };

  const restart = () => {
    setQuizStarted(false);
    setQuestions([]);
    setQuizComplete(false);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const diffColors = {
    facil: 'from-emerald-500 to-green-600',
    medio: 'from-amber-500 to-orange-600',
    dificil: 'from-red-500 to-rose-600',
  };

  const diffLabels = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto max-w-md space-y-6 p-4 md:p-6 text-center">
        <div>
          <div className="text-6xl mb-4">
            {percentage >= 80 ? '🏆' : percentage >= 60 ? '🌟' : '💪'}
          </div>
          <h2 className="text-2xl font-bold">Quiz Completo!</h2>
          <p className="text-muted-foreground text-sm mt-1">{topic}</p>
        </div>

        <Card className="border-border/40">
          <CardContent className="p-6">
            <div className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {score}/{questions.length}
            </div>
            <p className="text-sm text-muted-foreground">{percentage}% de acerto</p>
            <Progress value={percentage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-3">
              {percentage >= 80 ? 'Excelente! Você dominou esse assunto! 🎉' :
               percentage >= 60 ? 'Bom trabalho! Continue estudando! 💪' :
               'Continue praticando! A prática leva à perfeição! 📚'}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={restart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Novo Quiz
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" onClick={generateQuiz}>
            <Play className="h-4 w-4 mr-2" />
            Tentar de Novo
          </Button>
        </div>
      </div>
    );
  }

  if (quizStarted && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{currentQ + 1} de {questions.length}</Badge>
          <Badge className={`bg-gradient-to-r ${diffColors[difficulty]} text-white border-0`}>
            {diffLabels[difficulty]}
          </Badge>
        </div>

        <Progress value={((currentQ) / questions.length) * 100} className="h-1.5" />

        <Card className="border-border/40">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold leading-relaxed">{q.question}</h3>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {q.options.map((option, i) => {
            let className = 'w-full justify-start h-auto py-3 px-4 text-left border-border/40';
            if (showResult) {
              if (i === q.correct) {
                className += ' bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
              } else if (i === selectedAnswer && i !== q.correct) {
                className += ' bg-red-500/20 border-red-500/50 text-red-400';
              } else {
                className += ' opacity-50';
              }
            }

            return (
              <Button
                key={i}
                variant="outline"
                className={className}
                onClick={() => handleAnswer(i)}
                disabled={showResult}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm">{option}</span>
                  {showResult && i === q.correct && <Check className="h-4 w-4 ml-auto text-emerald-400" />}
                  {showResult && i === selectedAnswer && i !== q.correct && <X className="h-4 w-4 ml-auto text-red-400" />}
                </span>
              </Button>
            );
          })}
        </div>

        {showResult && (
          <Card className={`border-border/40 ${selectedAnswer === q.correct ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 <strong>Explicação:</strong> {q.explanation}
              </p>
            </CardContent>
          </Card>
        )}

        {showResult && (
          <Button className="w-full" onClick={nextQuestion}>
            {currentQ < questions.length - 1 ? (
              <>
                Próxima Pergunta
                <Zap className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Ver Resultado
                <Trophy className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">❓ Quiz IA</h2>
        <p className="text-xs text-muted-foreground">Teste seu conhecimento com quizzes gerados por IA</p>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Sobre qual tema você quer ser testado?</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: História do Brasil, Física, Inglês..."
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Dificuldade</Label>
            <div className="flex gap-2">
              {(['facil', 'medio', 'dificil'] as const).map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  className={`flex-1 text-xs ${difficulty === d ? `bg-gradient-to-r ${diffColors[d]} text-white border-0` : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {diffLabels[d]}
                </Button>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            onClick={generateQuiz}
            disabled={!topic.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando Quiz...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Gerar Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full text-xs" onClick={loadHistory}>
        📊 {showHistory ? 'Esconder' : 'Ver'} Histórico ({getQuizResults().length} quizzes)
      </Button>

      {showHistory && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum quiz realizado ainda</p>
          ) : (
            history.slice(-10).reverse().map((r) => (
              <Card key={r.id} className="border-border/40">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.topic}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.timestamp).toLocaleDateString('pt-BR')} • {diffLabels[r.difficulty as keyof typeof diffLabels]}
                    </p>
                  </div>
                  <Badge variant={r.score / r.total >= 0.8 ? 'default' : 'secondary'}>
                    {r.score}/{r.total}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Card className="border-border/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            🧪 <strong>Recall Ativo:</strong> Testar-se é uma das formas mais eficazes de aprender! Quanto mais você tenta lembrar, mais forte a memória fica. Use o quiz regularmente para reforçar o aprendizado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
