"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Zap, Layers, RefreshCw, PenTool, Image } from "lucide-react";

const techniques = [
  {
    id: "spaced",
    icon: RefreshCw,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Prática Espaçada",
    short: "Distribua seu estudo ao longo do tempo",
    description:
      "Em vez de estudar tudo de uma vez, distribua suas sessões de revisão em intervalos crescentes: dia 1, dia 2, dia 4, dia 7, dia 14, dia 30.",
    howTo: [
      "Divida o conteúdo em partes pequenas",
      "Revise após 1 dia, depois 3, depois 7, depois 14 dias",
      "Use apps como Anki para automatizar os intervalos",
      "Nunca deixe para estudar na véspera!",
    ],
    why: "O cérebro precisa de intervalos para consolidar memórias. Cada revisão fortalece as trilhas neurais.",
  },
  {
    id: "recall",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Recuperação Ativa",
    short: "Force seu cérebro a lembrar",
    description:
      "Feche o livro e tente lembrar o que estudou. O esforço de lembrar é o que fortalece a memória.",
    howTo: [
      "Após ler, feche o material e escreva o que lembra",
      "Use flashcards — tente responder ANTES de virar",
      "Resolva questões sem consultar o material",
      "Explique o conteúdo em voz alta",
    ],
    why: "Releitura passiva dá falsa sensação de domínio. O esforço de recuperação ativa é o motor da aprendizagem.",
  },
  {
    id: "feynman",
    icon: PenTool,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Técnica Feynman",
    short: "Explique como se fosse para uma criança",
    description:
      "Se você não consegue explicar algo de forma simples, é porque não entendeu de verdade.",
    howTo: [
      "Escolha um conceito que quer aprender",
      "Escreva uma explicação como se fosse para uma criança de 12 anos",
      "Identifique os pontos onde sua explicação fica confusa",
      "Volte ao material e preencha essas lacunas",
      "Simplifique e crie analogias do cotidiano",
    ],
    why: "Simplificar força processamento profundo e revela lacunas de entendimento que passam despercebidas.",
  },
  {
    id: "dual",
    icon: Image,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    title: "Codificação Dupla",
    short: "Combine texto com imagens",
    description:
      "Use dois canais do cérebro (verbal + visual) para dobrar a capacidade de retenção.",
    howTo: [
      "Crie diagramas e mapas mentais dos conceitos",
      "Transforme fórmulas em gráficos visuais",
      "Use cores para categorizar informações",
      "Inclua esquemas e desenhos nas suas notas",
    ],
    why: "O cérebro tem canais separados para processar palavras e imagens. Usar ambos distribui a carga cognitiva.",
  },
  {
    id: "interleaving",
    icon: Layers,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    title: "Interleaving (Intercalação)",
    short: "Misture diferentes tópicos na mesma sessão",
    description:
      "Alternar entre assuntos força o cérebro a discriminar conceitos e identificar quando aplicar cada um.",
    howTo: [
      "Em vez de 2h só de matemática, faça 40min de mat + 40min de física + 40min de química",
      "Intercale tipos diferentes de problemas",
      "Estude períodos históricos misturados em vez de separados",
      "Misture temas similares que costumam confundir",
    ],
    why: "O cérebro precisa praticar a identificação de qual técnica usar em cada situação — não apenas a aplicação.",
  },
  {
    id: "elaboration",
    icon: Lightbulb,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Elaboração",
    short: "Faça perguntas 'por quê?' e 'como?'",
    description:
      "Explique conceitos com suas palavras e conecte-os ao que você já sabe. Crie múltiplas rotas de acesso na memória.",
    howTo: [
      'Pergunte "Por que isso é verdade?" para cada conceito',
      'Pergunte "Como isso se conecta com o que eu já sei?"',
      'Pergunte "O que aconteceria se isso mudasse?"',
      "Ensine o conceito para outra pessoa",
      "Crie analogias com situações do dia a dia",
    ],
    why: "Conexões elaboradas criam múltiplas âncoras na memória, facilitando a recuperação e transferência.",
  },
];

export default function TechniqueCards() {
  return (
    <div className="space-y-2">
      {techniques.map((technique) => {
        const Icon = technique.icon;
        return (
          <Accordion
            key={technique.id}
            type="single"
            collapsible
            className="rounded-xl border border-border/40 bg-card/80 backdrop-blur"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 rounded-xl [&[data-state=open]]:rounded-b-none">
              <div className="flex items-center gap-3 text-left">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${technique.bg}`}
                >
                  <Icon className={`h-4 w-4 ${technique.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{technique.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {technique.short}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {technique.description}
                </p>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="secondary" className="text-[10px]">
                      Como aplicar
                    </Badge>
                  </div>
                  <ul className="space-y-1.5">
                    {technique.howTo.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-foreground/80"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Por que funciona
                  </span>
                  <p className="text-xs mt-1 text-foreground/80">
                    {technique.why}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </Accordion>
        );
      })}
    </div>
  );
}
