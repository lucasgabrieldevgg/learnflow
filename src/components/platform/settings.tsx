'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { type ViewId } from './sidebar';
import {
  getUserProfile,
  getProgress,
  exportAllData,
  importAllData,
  clearAllData,
  type UserProfile,
  type UserProgress,
} from '@/lib/storage';
import {
  getAllProviderStatuses,
  resetAllCooldowns,
  getProviderConfigs,
  type ProviderStatus,
} from '@/lib/ai-provider';
import {
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  User,
  Target,
  BarChart3,
  Sun,
  Moon,
  Shield,
  Info,
  Heart,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  BadgeCheck,
} from 'lucide-react';

const levelLabels: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const levelColors: Record<string, string> = {
  iniciante: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  intermediario: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  avancado: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
};

interface SettingsProps {
  onNavigate?: (view: ViewId) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgressState] = useState<UserProgress | null>(null);
  const [copied, setCopied] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [apiStatuses, setApiStatuses] = useState<ProviderStatus[]>([]);
  const [cooldownReset, setCooldownReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setProfile(getUserProfile());
    setProgressState(getProgress());
    setApiStatuses(getAllProviderStatuses());
  }, []);

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `learnflow_backup_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = importAllData(content);
      if (success) {
        setImportSuccess('Dados restaurados com sucesso! Recarregue a página.');
        setImportError(null);
        setProfile(getUserProfile());
        setProgressState(getProgress());
      } else {
        setImportError('Erro ao importar. Verifique o arquivo.');
        setImportSuccess(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    clearAllData();
    window.location.reload();
  };

  const handleCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleThemeToggle = () => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };

  const handleResetCooldowns = () => {
    resetAllCooldowns();
    setCooldownReset(true);
    setApiStatuses(getAllProviderStatuses());
    setTimeout(() => setCooldownReset(false), 3000);
  };

  const handleRefreshStatuses = () => {
    setApiStatuses(getAllProviderStatuses());
  };

  if (!profile || !progress) return null;

  const createdDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  const onlineCount = apiStatuses.filter(s => s.status === 'online').length;
  const totalProviders = getProviderConfigs().length;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">Configurações</h2>
        <p className="text-xs text-muted-foreground">Gerencie seu perfil, dados e APIs de IA</p>
      </div>

      {/* User Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{profile.name || 'Aprendiz'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-violet-400 transition-colors"
                  >
                    {profile.id || 'LF-XXXXX'}
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-background/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Objetivo</span>
                </div>
                <p className="text-sm font-medium">{profile.goal || 'Não definido'}</p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Nível</span>
                </div>
                <Badge variant="outline" className={`text-xs ${levelColors[profile.level] || 'text-muted-foreground'}`}>
                  {levelLabels[profile.level] || profile.level}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Membro desde {createdDate}</span>
              <span>{progress.xp} XP total</span>
              <span>Nível {progress.level}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Provider Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold">APIs de IA</h3>
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0">
                  {onlineCount}/{totalProviders} online
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-muted-foreground hover:text-violet-400"
                  onClick={handleRefreshStatuses}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Atualizar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-muted-foreground hover:text-amber-400"
                  onClick={handleResetCooldowns}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            {cooldownReset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
              >
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cooldowns resetados! Todas as APIs serão testadas novamente.
                </p>
              </motion.div>
            )}

            <div className="space-y-1.5">
              {apiStatuses.map((status) => (
                <div
                  key={status.id}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                    status.status === 'online'
                      ? 'bg-emerald-500/5 border border-emerald-500/15'
                      : status.status === 'offline'
                      ? 'bg-red-500/5 border border-red-500/15'
                      : 'bg-muted/20 border border-border/20'
                  }`}
                >
                  {status.status === 'online' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : status.status === 'offline' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={`flex-1 truncate ${
                    status.status === 'online' ? 'text-emerald-300' :
                    status.status === 'offline' ? 'text-red-300' :
                    'text-muted-foreground'
                  }`}>
                    {status.name}
                  </span>
                  {status.latencyMs && (
                    <span className="text-[9px] text-muted-foreground/60 shrink-0">
                      {status.latencyMs}ms
                    </span>
                  )}
                  {status.totalCalls > 0 && (
                    <span className="text-[9px] text-muted-foreground/40 shrink-0">
                      {status.totalCalls}x
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground">
              Fallback automático: se uma API falhar, o sistema tenta a próxima.
              APIs entram em cooldown de 5 min após falha. Clique &quot;Reset&quot; para limpar.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Dados e Backup</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-11 justify-start text-sm border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2 text-emerald-400" />
                Exportar Dados (JSON)
              </Button>

              <Button
                variant="outline"
                className="h-11 justify-start text-sm border-border/50 hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:text-cyan-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2 text-cyan-400" />
                Importar Dados
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />

            {importSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
              >
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {importSuccess}
                </p>
              </motion.div>
            )}

            {importError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
              >
                <p className="text-xs text-red-400">{importError}</p>
              </motion.div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Seus dados ficam salvos no navegador (localStorage). Exporte para backup
              ou transfira entre dispositivos. Ideal para usar no GitHub Pages!
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Aparência</h3>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Tema</p>
                <p className="text-[10px] text-muted-foreground">Alternar entre claro e escuro</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleThemeToggle}
              >
                {document.documentElement.classList.contains('dark') ? (
                  <>
                    <Moon className="h-3.5 w-3.5 mr-1.5" />
                    Escuro
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 mr-1.5" />
                    Claro
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-red-500/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Zona de Perigo</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Isso apagará todos os seus dados permanentemente, incluindo perfil, histórico de chat, flashcards e progresso.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start text-sm border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Todos os Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos, incluindo:
                    perfil, histórico de conversas, flashcards, notas, quizzes e progresso.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClear}
                    className="bg-red-600 hover:bg-red-500"
                  >
                    Sim, apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-border/40 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
          <CardContent className="p-5 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                LearnFlow
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Plataforma de Aprendizagem Inteligente
            </p>
            <p className="text-[10px] text-muted-foreground">
              Feito com <Heart className="h-3 w-3 inline text-red-400" /> usando Next.js, Tailwind CSS e IA
            </p>
            <Separator className="opacity-30" />
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span>12 ferramentas</span>
              <span>7 APIs de IA</span>
              <span>Fallback automático</span>
              <span>100% local</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="h-4" />
    </div>
  );
}
