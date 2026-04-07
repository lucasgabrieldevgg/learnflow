"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  StickyNote,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardCreator() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<"create" | "study">("create");

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    setCards([
      ...cards,
      { id: crypto.randomUUID(), front: front.trim(), back: back.trim() },
    ]);
    setFront("");
    setBack("");
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
    if (currentIndex >= cards.length - 1) {
      setCurrentIndex(Math.max(0, cards.length - 2));
    }
    setIsFlipped(false);
  };

  const startStudy = () => {
    if (cards.length === 0) return;
    setCurrentIndex(0);
    setIsFlipped(false);
    setMode("study");
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (cards.length === 0 || mode === "create") {
    return (
      <Card className="border-border/40 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-5 w-5 text-primary" />
            Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <p className="text-xs text-muted-foreground">
            Crie flashcards para praticar recuperação ativa. Escreva a pergunta na
            frente e a resposta no verso.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Frente (pergunta)
              </label>
              <Textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Ex: Qual é a função do hipocampo?"
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Verso (resposta)
              </label>
              <Textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Ex: Formação de novas memórias de longo prazo..."
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
            <Button
              onClick={addCard}
              disabled={!front.trim() || !back.trim()}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Card
            </Button>
          </div>

          {cards.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{cards.length} cards</Badge>
                <Button size="sm" onClick={startStudy}>
                  Estudar
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2"
                  >
                    <span className="text-xs truncate flex-1">
                      {card.front}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCard(card.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-5 w-5 text-primary" />
            Estudando
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {currentIndex + 1}/{cards.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setMode("create");
                setIsFlipped(false);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-6">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full min-h-[180px] cursor-pointer"
        >
          <div
            className={`w-full min-h-[180px] rounded-xl border-2 border-border/60 flex items-center justify-center p-6 transition-all duration-300 ${
              isFlipped
                ? "bg-primary/10 border-primary/30"
                : "bg-muted/50 hover:border-primary/20"
            }`}
          >
            <div className="text-center">
              {isFlipped ? (
                <div className="space-y-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] mb-2"
                  >
                    Resposta
                  </Badge>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] mb-2"
                  >
                    Pergunta
                  </Badge>
                  <p className="text-sm font-medium whitespace-pre-wrap">
                    {currentCard.front}
                  </p>
                </div>
              )}
            </div>
          </div>
        </button>

        {!isFlipped && (
          <p className="text-xs text-muted-foreground">
            Clique no card para ver a resposta
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={prevCard}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={shuffleCards}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Embaralhar
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={nextCard}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
