'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Search,
  Download,
  ChevronLeft,
  BookOpen,
  StickyNote,
} from 'lucide-react';
import {
  getCornellNotes,
  setCornellNotes,
  generateId,
  addXP,
  type CornellNote,
} from '@/lib/storage';

export default function CornellNotes() {
  const [notes, setNotes] = useState<CornellNote[]>(() => getCornellNotes());
  const [selectedNote, setSelectedNote] = useState<CornellNote | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [cues, setCues] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [summary, setSummary] = useState('');

  const createNote = () => {
    if (!newTitle.trim()) return;
    const note: CornellNote = {
      id: generateId(),
      title: newTitle.trim(),
      cues: '',
      notes: '',
      summary: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    setCornellNotes(updated);
    setSelectedNote(note);
    setCues('');
    setNoteContent('');
    setSummary('');
    setNewTitle('');
    setShowNew(false);
  };

  const saveNote = () => {
    if (!selectedNote) return;
    const updated = notes.map(n =>
      n.id === selectedNote.id
        ? { ...n, cues, notes: noteContent, summary, updatedAt: Date.now() }
        : n
    );
    setNotes(updated);
    setCornellNotes(updated);
    setSelectedNote({ ...selectedNote, cues, notes: noteContent, summary, updatedAt: Date.now() });
    addXP(5);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    setCornellNotes(updated);
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const selectNote = (note: CornellNote) => {
    setSelectedNote(note);
    setCues(note.cues);
    setNoteContent(note.notes);
    setSummary(note.summary);
  };

  const exportNote = (note: CornellNote) => {
    const text = `# ${note.title}\n\n## Palavras-chave / Perguntas\n${note.cues}\n\n## Notas\n${note.notes}\n\n## Resumo\n${note.summary}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotes = searchQuery
    ? notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.cues.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  // Edit view
  if (selectedNote) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { saveNote(); setSelectedNote(null); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold flex-1 truncate">{selectedNote.title}</h2>
          <Button variant="outline" size="sm" onClick={exportNote}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" onClick={saveNote}>
            <Save className="h-3.5 w-3.5 mr-1" />
            Salvar
          </Button>
        </div>

        {/* Cornell layout */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
          {/* Cue Column */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              📌 Palavras-chave / Perguntas
            </Label>
            <Textarea
              value={cues}
              onChange={(e) => setCues(e.target.value)}
              placeholder="Escreva palavras-chave, perguntas-chave..."
              className="min-h-[300px] text-sm resize-none"
            />
          </div>

          {/* Notes Column */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              📝 Notas Principais
            </Label>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Escreva suas notas aqui..."
              className="min-h-[300px] text-sm resize-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            📋 Resumo
          </Label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Resuma os pontos principais da nota..."
            className="min-h-[100px] text-sm resize-none"
          />
        </div>

        <Card className="border-border/40 bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              📖 <strong>Método Cornell:</strong> Na coluna esquerda, escreva palavras-chave e perguntas. Na direita, suas notas detalhadas. Depois, escreva um resumo na parte inferior. Revise cobrindo a coluna de notas e usando as pistas para lembrar!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">📝 Notas Cornell</h2>
        <p className="text-xs text-muted-foreground">Organize seus estudos com o método Cornell</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar notas..."
          className="pl-9"
        />
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
            <Plus className="h-4 w-4 mr-2" />
            Nova Nota
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Nota Cornell</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Título da Nota</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Aula de Biologia - Células" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createNote} disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className="cursor-pointer border-border/40 hover:border-violet-500/30 transition-all"
            onClick={() => selectNote(note)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-amber-400 shrink-0" />
                    <p className="text-sm font-semibold truncate">{note.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {note.summary || note.notes || 'Sem conteúdo ainda...'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[9px]">
                      {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                    </Badge>
                    {(note.cues || note.notes || note.summary) && (
                      <span className="text-[9px] text-emerald-400">✓ Preenchida</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredNotes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {searchQuery ? 'Nenhuma nota encontrada' : 'Nenhuma nota criada ainda'}
          </div>
        )}
      </div>
    </div>
  );
}
