'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Check,
  X,
  AlertCircle,
  Star,
  Layers,
} from 'lucide-react';
import {
  getDecks,
  setDecks,
  getFlashcards,
  setFlashcards,
  generateId,
  COLORS,
  addXP,
  getProgress,
  setProgress,
  type Deck,
  type Flashcard,
} from '@/lib/storage';

export default function Flashcards() {
  const [decks, setDecksState] = useState<Deck[]>([]);
  const [cards, setCardsState] = useState<Flashcard[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);

  // New card form
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckColor, setNewDeckColor] = useState(COLORS[0]);

  useEffect(() => {
    setDecksState(getDecks());
    setCardsState(getFlashcards());
  }, []);

  const refresh = () => {
    setDecksState(getDecks());
    setCardsState(getFlashcards());
  };

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    const deck: Deck = {
      id: generateId(),
      name: newDeckName.trim(),
      color: newDeckColor,
      createdAt: Date.now(),
    };
    const updated = [...decks, deck];
    setDecksState(updated);
    setDecks(updated);
    setNewDeckName('');
    setShowNewDeck(false);
  };

  const createCard = () => {
    if (!selectedDeck || !newFront.trim() || !newBack.trim()) return;
    const card: Flashcard = {
      id: generateId(),
      front: newFront.trim(),
      back: newBack.trim(),
      deckId: selectedDeck,
      interval: 0,
      easeFactor: 2.5,
      nextReview: Date.now(),
      repetitions: 0,
    };
    const updated = [...cards, card];
    setCardsState(updated);
    setFlashcards(updated);
    setNewFront('');
    setNewBack('');
    setShowNewCard(false);
  };

  const deleteDeck = (deckId: string) => {
    setDecksState(decks.filter(d => d.id !== deckId));
    setDecks(decks.filter(d => d.id !== deckId));
    setCardsState(cards.filter(c => c.deckId !== deckId));
    setFlashcards(cards.filter(c => c.deckId !== deckId));
    if (selectedDeck === deckId) setSelectedDeck(null);
  };

  const deleteCard = (cardId: string) => {
    const updated = cards.filter(c => c.id !== cardId);
    setCardsState(updated);
    setFlashcards(updated);
  };

  const getDeckCards = (deckId: string) => cards.filter(c => c.deckId === deckId);
  const getDueCards = (deckId: string) => cards.filter(c => c.deckId === deckId && c.nextReview <= Date.now());
  const getTotalDueCards = () => cards.filter(c => c.nextReview <= Date.now()).length;

  // SM-2 Spaced Repetition
  const rateCard = (quality: number) => {
    // quality: 1=Again, 2=Hard, 3=Good, 4=Easy
    if (studyCards.length === 0) return;

    const card = { ...studyCards[studyIndex] };
    const q = Math.max(0, Math.min(5, quality));

    if (q >= 3) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }

    card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    card.nextReview = Date.now() + card.interval * 24 * 60 * 60 * 1000;

    const updatedCards = cards.map(c => c.id === card.id ? card : c);
    setCardsState(updatedCards);
    setFlashcards(updatedCards);

    // Award XP
    addXP(q >= 3 ? 15 : 5);
    const p = getProgress();
    p.flashcardsReviewed++;
    setProgress(p);

    // Next card
    if (studyIndex < studyCards.length - 1) {
      setStudyIndex(studyIndex + 1);
      setShowAnswer(false);
    } else {
      setStudyMode(false);
      refresh();
    }
  };

  const startStudy = (deckId: string) => {
    const due = getDueCards(deckId);
    if (due.length === 0) {
      return;
    }
    setStudyCards(due);
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyMode(true);
  };

  const startStudyAll = () => {
    const due = cards.filter(c => c.nextReview <= Date.now());
    if (due.length === 0) return;
    setStudyCards(due);
    setStudyIndex(0);
    setShowAnswer(false);
    setStudyMode(true);
    setSelectedDeck(null);
  };

  // Study Mode
  if (studyMode && studyCards.length > 0) {
    const card = studyCards[studyIndex];
    const progress = ((studyIndex + 1) / studyCards.length) * 100;

    return (
      <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold">🃏 Modo de Estudo</h2>
          <p className="text-xs text-muted-foreground">
            Cartão {studyIndex + 1} de {studyCards.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div
          className="min-h-[250px] rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/80 p-6 flex flex-col items-center justify-center cursor-pointer transition-all"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {!showAnswer ? (
            <div className="text-center space-y-3">
              <Badge variant="secondary" className="text-[10px]">Pergunta</Badge>
              <p className="text-lg font-medium leading-relaxed">{card.front}</p>
              <p className="text-xs text-muted-foreground mt-4">Toque para ver a resposta</p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Badge variant="secondary" className="text-[10px]">Resposta</Badge>
              <p className="text-base leading-relaxed text-foreground/90">{card.back}</p>
            </div>
          )}
        </div>

        {/* Rating Buttons */}
        {showAnswer && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">Como foi sua memória?</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { q: 1, label: 'De novo', color: 'from-red-500 to-rose-600', icon: RotateCcw },
                { q: 2, label: 'Difícil', color: 'from-orange-500 to-amber-600', icon: AlertCircle },
                { q: 3, label: 'Bom', color: 'from-emerald-500 to-green-600', icon: Check },
                { q: 4, label: 'Fácil', color: 'from-violet-500 to-purple-600', icon: Star },
              ].map(({ q, label, color, icon: Icon }) => (
                <Button
                  key={q}
                  onClick={() => rateCard(q)}
                  className={`h-auto py-3 flex flex-col items-center gap-1 bg-gradient-to-br ${color} text-white hover:opacity-90`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px]">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => { setStudyMode(false); refresh(); }}
        >
          Sair do modo de estudo
        </Button>
      </div>
    );
  }

  // Deck view
  if (selectedDeck) {
    const deck = decks.find(d => d.id === selectedDeck);
    const deckCards = getDeckCards(selectedDeck);
    const dueCards = getDueCards(selectedDeck);

    return (
      <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDeck(null)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: deck?.color }} />
            <h2 className="text-lg font-bold truncate">{deck?.name}</h2>
          </div>
          <Badge variant="secondary">{deckCards.length} cartões</Badge>
          {dueCards.length > 0 && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
              {dueCards.length} para revisar
            </Badge>
          )}
        </div>

        {dueCards.length > 0 && (
          <Button
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            onClick={() => startStudy(selectedDeck)}
          >
            <Play className="h-4 w-4 mr-2" />
            Estudar ({dueCards.length} cartões)
          </Button>
        )}

        <Dialog open={showNewCard} onOpenChange={setShowNewCard}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cartão</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Frente (Pergunta)</Label>
                <Textarea value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Qual a pergunta?" className="min-h-[80px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Verso (Resposta)</Label>
                <Textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Qual a resposta?" className="min-h-[80px]" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createCard} disabled={!newFront.trim() || !newBack.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Criar Cartão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cards list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {deckCards.map((card) => (
            <Card key={card.id} className="border-border/40">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.front}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{card.back}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-[9px]">
                        {card.repetitions === 0 ? 'Novo' : `Rep: ${card.repetitions}`}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        Intervalo: {card.interval === 0 ? 'agora' : `${card.interval}d`}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteCard(card.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {deckCards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum cartão neste baralho ainda
            </div>
          )}
        </div>

        <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteDeck(selectedDeck)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Baralho
        </Button>
      </div>
    );
  }

  // Main view - deck list
  const totalDue = getTotalDueCards();

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">🃏 Flashcards</h2>
        <p className="text-xs text-muted-foreground">Revisão espaçada para memorizar qualquer coisa</p>
      </div>

      {totalDue > 0 && (
        <Button
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 h-12"
          onClick={startStudyAll}
        >
          <Play className="h-4 w-4 mr-2" />
          Estudar todos ({totalDue} cartões para revisar)
        </Button>
      )}

      <Dialog open={showNewDeck} onOpenChange={setShowNewDeck}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Novo Baralho
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Baralho</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do baralho</Label>
              <Input value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="Ex: Matemática, Inglês..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${newDeckColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewDeckColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createDeck} disabled={!newDeckName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Baralho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deck list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {decks.map((deck) => {
          const deckCards = getDeckCards(deck.id);
          const due = getDueCards(deck.id);
          return (
            <Card
              key={deck.id}
              className="cursor-pointer border-border/40 hover:border-violet-500/30 transition-all"
              onClick={() => setSelectedDeck(deck.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: deck.color + '20' }}>
                      <BookOpen className="h-5 w-5" style={{ color: deck.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{deck.name}</p>
                      <p className="text-xs text-muted-foreground">{deckCards.length} cartões</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {due > 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">{due}</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {decks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum baralho criado ainda. Crie seu primeiro baralho!
          </div>
        )}
      </div>

      {/* Tip */}
      <Card className="border-border/40 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            🧠 <strong>Dica:</strong> A repetição espaçada revisa os cartões em intervalos crescentes. Cartões difíceis aparecem mais frequentemente, e os fáceis aparecem menos. É a forma mais eficaz de memorizar!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
