"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Trash2,
  Loader2,
} from "lucide-react";
import { AI_SYSTEM_PROMPT } from "@/lib/ai-config";

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string,
          options: {
            model: string;
            stream: boolean;
            messages: Array<{ role: string; content: string }>;
          }
        ) => Promise<AsyncIterable<{ text: string }> | { message: { content: Array<{ text: string }> } }>;
      };
    };
  }
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  onCompleteSession?: () => void;
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-4 py-3"
    >
      <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/30">
        <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
          🥷
        </AvatarFallback>
      </Avatar>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
          <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
          <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`message-animate flex items-start gap-3 px-4 py-2 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/30 mt-1">
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            🥷
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </motion.div>
  );
}

export default function ChatWindow({ onCompleteSession }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const clearChat = () => {
    setMessages([]);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (abortRef.current) {
      abortRef.current = true;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const apiMessages = [
        { role: "system", content: AI_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: trimmed },
      ];

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);
      setIsStreaming(true);
      abortRef.current = false;

      if (typeof window !== "undefined" && window.puter?.ai?.chat) {
        const response = await window.puter.ai.chat(trimmed, {
          model: "gpt-4.1-nano",
          stream: true,
          messages: apiMessages,
        });

        let accumulated = "";

        if (Symbol.asyncIterator in Object(response)) {
          for await (const chunk of response as AsyncIterable<{ text: string }>) {
            if (abortRef.current) break;
            const text = chunk.text || "";
            accumulated += text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: accumulated } : m
              )
            );
          }
        } else {
          const resp = response as {
            message: { content: Array<{ text: string }> };
          };
          accumulated =
            resp?.message?.content?.[0]?.text || "Desculpe, não consegui gerar uma resposta.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        }

        if (!abortRef.current && onCompleteSession) {
          onCompleteSession();
        }
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "⚠️ Ops! Parece que o serviço de IA não está disponível no momento. Verifique sua conexão e tente novamente.",
                }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.role === "assistant" && !lastMsg.content) {
          updated[updated.length - 1] = {
            ...lastMsg,
            content:
              "Desculpe, ocorreu um erro. Por favor, tente novamente. 💜",
          };
        } else {
          updated.push({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Desculpe, ocorreu um erro. Por favor, tente novamente. 💜",
            timestamp: new Date(),
          });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/40">
            <AvatarFallback className="bg-primary/20 text-primary text-lg">
              🥷
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold">Ninja</h2>
            <p className="text-xs text-muted-foreground">
              Seu coach de aprendizagem
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={clearChat}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-0" ref={scrollRef}>
        <div className="flex flex-col gap-1 py-4">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-6xl"
              >
                🥷
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Olá! Eu sou o Ninja 👋
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Estou aqui pra te ajudar a aprender qualquer coisa de forma
                  inteligente. Me conta: o que você quer aprender hoje?
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {[
                  "Quero aprender a programar 💻",
                  "Preciso estudar para prova 📚",
                  "Quero aprender um idioma 🌍",
                  "Como estudar melhor? 🧠",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && !isStreaming && <TypingIndicator />}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border/50 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-muted/30 p-2 transition-colors focus-within:border-primary/40 focus-within:bg-muted/50">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[120px] flex-1 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
          Ninja pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
}
