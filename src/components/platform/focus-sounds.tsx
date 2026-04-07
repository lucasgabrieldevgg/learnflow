'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Volume2,
  VolumeX,
  CloudRain,
  CloudLightning,
  Bird,
  Flame,
  Wind,
  Waves,
  Timer,
  Coffee,
  TreePine,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';

interface SoundChannel {
  id: string;
  name: string;
  emoji: string;
  icon: React.ElementType;
  volume: number;
  active: boolean;
  type: 'rain' | 'thunder' | 'birds' | 'fire' | 'wind' | 'whitenoise' | 'ocean';
}

const INITIAL_SOUNDS: SoundChannel[] = [
  { id: 'rain', name: 'Chuva', emoji: '🌧️', icon: CloudRain, volume: 70, active: false, type: 'rain' },
  { id: 'thunder', name: 'Trovão', emoji: '⛈️', icon: CloudLightning, volume: 40, active: false, type: 'thunder' },
  { id: 'birds', name: 'Pássaros', emoji: '🐦', icon: Bird, volume: 50, active: false, type: 'birds' },
  { id: 'fire', name: 'Lareira', emoji: '🔥', icon: Flame, volume: 60, active: false, type: 'fire' },
  { id: 'wind', name: 'Vento', emoji: '💨', icon: Wind, volume: 50, active: false, type: 'wind' },
  { id: 'ocean', name: 'Oceano', emoji: '🌊', icon: Waves, volume: 60, active: false, type: 'ocean' },
  { id: 'whitenoise', name: 'Ruido Branco', emoji: '📻', icon: Volume2, volume: 40, active: false, type: 'whitenoise' },
];

interface Preset {
  id: string;
  name: string;
  emoji: string;
  sounds: Record<string, number>;
}

const PRESETS: Preset[] = [
  { id: 'cafe', name: 'Café', emoji: '☕', sounds: { fire: 70, rain: 30 } },
  { id: 'forest', name: 'Floresta', emoji: '🌲', sounds: { birds: 60, wind: 30 } },
  { id: 'rain', name: 'Chuva', emoji: '🌧️', sounds: { rain: 80, thunder: 20 } },
  { id: 'deep', name: 'Estudo Profundo', emoji: '📚', sounds: { whitenoise: 50, rain: 20 } },
  { id: 'ocean', name: 'Praia', emoji: '🏖️', sounds: { ocean: 70, wind: 20, birds: 30 } },
  { id: 'cozy', name: 'Aconchego', emoji: '🕯️', sounds: { fire: 80, wind: 10 } },
];

// Generate noise using Web Audio API
function createNoiseGenerator(ctx: AudioContext, type: SoundChannel['type'], masterGain: GainNode): { start: () => void; stop: () => void } {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  // Generate noise pattern based on type
  const sampleRate = ctx.sampleRate;
  for (let i = 0; i < bufferSize; i++) {
    switch (type) {
      case 'rain':
        output[i] = (Math.random() * 2 - 1) * 0.3;
        if (i % 100 < 3) output[i] *= 2;
        break;
      case 'thunder':
        output[i] = Math.random() * 2 - 1;
        output[i] *= Math.sin(i / sampleRate * 0.5) * 0.5;
        break;
      case 'fire':
        output[i] = (Math.random() * 2 - 1);
        output[i] *= 0.2 + Math.sin(i / sampleRate * 3) * 0.15;
        break;
      case 'wind':
        output[i] = (Math.random() * 2 - 1) * 0.4;
        output[i] *= Math.sin(i / sampleRate * 0.3) * 0.5;
        break;
      case 'whitenoise':
        output[i] = (Math.random() * 2 - 1) * 0.2;
        break;
      case 'ocean':
        const t = i / sampleRate;
        output[i] = (Math.random() * 2 - 1) * 0.3 * (0.5 + 0.5 * Math.sin(t * 0.3 * Math.PI * 2));
        break;
      case 'birds':
        output[i] = (Math.random() * 2 - 1) * 0.1;
        // Add chirps at random intervals
        if (Math.random() < 0.001) {
          const freq = 2000 + Math.random() * 3000;
          for (let j = 0; j < 200 && i + j < bufferSize; j++) {
            output[i + j] = Math.sin(j / sampleRate * freq * Math.PI * 2) * 0.3 * Math.exp(-j / 50);
          }
        }
        break;
      default:
        output[i] = (Math.random() * 2 - 1) * 0.3;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  // Add filter for more natural sound
  const filter = ctx.createBiquadFilter();
  switch (type) {
    case 'rain':
      filter.type = 'bandpass';
      filter.frequency.value = 3000;
      filter.Q.value = 0.5;
      break;
    case 'thunder':
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      break;
    case 'fire':
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.3;
      break;
    case 'wind':
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      break;
    case 'whitenoise':
      filter.type = 'allpass';
      break;
    case 'ocean':
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      break;
    case 'birds':
      filter.type = 'highpass';
      filter.frequency.value = 1500;
      break;
  }

  const gain = ctx.createGain();
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  gain.gain.value = 0;

  return {
    start: () => { try { source.start(); } catch {} },
    stop: () => { try { source.stop(); } catch {} },
  };
}

export default function FocusSounds() {
  const [sounds, setSounds] = useState<SoundChannel[]>(INITIAL_SOUNDS);
  const [masterMuted, setMasterMuted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const generatorsRef = useRef<Map<string, { start: () => void; stop: () => void; gain: GainNode }>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.value = 0.8;
    masterGainRef.current = master;
  }, []);

  const toggleSound = useCallback((id: string) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const master = masterGainRef.current!;

    setSounds(prev => prev.map(s => {
      if (s.id !== id) return s;
      const newActive = !s.active;

      if (newActive) {
        // Start sound
        const gen = createNoiseGenerator(ctx, s.type, master);
        gen.start();

        // Create a gain node for volume control
        const gain = ctx.createGain();
        gain.connect(master);
        gain.gain.value = s.volume / 100;

        generatorsRef.current.set(id, { ...gen, gain });
      } else {
        // Stop sound
        const gen = generatorsRef.current.get(id);
        if (gen) {
          gen.stop();
          generatorsRef.current.delete(id);
        }
      }

      return { ...s, active: newActive };
    }));
  }, [initAudio]);

  const setVolume = useCallback((id: string, volume: number) => {
    setSounds(prev => prev.map(s => {
      if (s.id !== id) return s;
      const gen = generatorsRef.current.get(id);
      if (gen && audioCtxRef.current) {
        gen.gain.gain.setValueAtTime(volume / 100, audioCtxRef.current.currentTime);
      }
      return { ...s, volume };
    }));
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const master = masterGainRef.current!;

    // Stop all current sounds
    generatorsRef.current.forEach((gen) => gen.stop());
    generatorsRef.current.clear();

    // Activate preset sounds
    setSounds(prev => prev.map(s => {
      const presetVolume = preset.sounds[s.id];
      const active = presetVolume !== undefined;
      if (active) {
        const gen = createNoiseGenerator(ctx, s.type, master);
        gen.start();
        const gain = ctx.createGain();
        gain.connect(master);
        gain.gain.value = presetVolume / 100;
        generatorsRef.current.set(s.id, { ...gen, gain });
        return { ...s, active: true, volume: presetVolume };
      }
      return { ...s, active: false };
    }));
  }, [initAudio]);

  const stopAll = () => {
    generatorsRef.current.forEach((gen) => gen.stop());
    generatorsRef.current.clear();
    setSounds(prev => prev.map(s => ({ ...s, active: false })));
  };

  const toggleMaster = () => {
    if (masterGainRef.current && audioCtxRef.current) {
      const newMuted = !masterMuted;
      masterGainRef.current.gain.setValueAtTime(
        newMuted ? 0 : 0.8,
        audioCtxRef.current.currentTime
      );
      setMasterMuted(newMuted);
    }
  };

  // Timer
  useEffect(() => {
    if (!timerActive || timerRemaining <= 0) return;
    timerRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          stopAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timerRemaining]);

  const startTimer = (mins: number) => {
    if (mins === 0) {
      // No timer
      setTimerActive(false);
      setTimerRemaining(0);
      return;
    }
    setTimerMinutes(mins);
    setTimerRemaining(mins * 60);
    setTimerActive(true);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const activeCount = sounds.filter(s => s.active).length;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generatorsRef.current.forEach((gen) => gen.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">🎵 Sons para Foco</h2>
          <p className="text-xs text-muted-foreground">Crie o ambiente perfeito para estudar</p>
        </div>
        {activeCount > 0 && (
          <Button variant="outline" size="sm" className="text-xs" onClick={stopAll}>
            <X className="h-3.5 w-3.5 mr-1" />
            Parar tudo
          </Button>
        )}
      </div>

      {/* Master Control */}
      {activeCount > 0 && (
        <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <Button variant="ghost" size="icon" onClick={toggleMaster}>
            {masterMuted ? <VolumeX className="h-5 w-5 text-muted-foreground" /> : <Volume2 className="h-5 w-5 text-violet-400" />}
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{activeCount} som{activeCount > 1 ? 's' : ''} tocando</p>
            <div className="flex gap-1 mt-1">
              {[...Array(activeCount)].map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
          {timerActive && (
            <Badge variant="secondary" className="text-xs font-mono">
              <Timer className="h-3 w-3 mr-1" />
              {formatTimer(timerRemaining)}
            </Badge>
          )}
        </div>
      )}

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Mixes Prontos</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="rounded-xl border border-border/40 p-3 text-center transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
            >
              <span className="text-xl">{preset.emoji}</span>
              <p className="text-[10px] font-medium mt-1">{preset.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Sounds */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Controle Individual</p>
        <div className="space-y-1.5">
          {sounds.map(sound => {
            const Icon = sound.icon;
            return (
              <Card key={sound.id} className={`border-border/40 transition-all ${sound.active ? 'border-violet-500/30 bg-violet-500/5' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSound(sound.id)}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                        sound.active
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <span className="text-lg">{sound.emoji}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{sound.name}</p>
                      {sound.active && (
                        <Slider
                          value={[sound.volume]}
                          onValueChange={([v]) => setVolume(sound.id, v)}
                          max={100}
                          step={5}
                          className="mt-1"
                        />
                      )}
                    </div>
                    {sound.active && (
                      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                        {sound.volume}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Auto-stop Timer */}
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-3.5 w-3.5 text-violet-400" />
            <p className="text-xs font-semibold">Desligar automaticamente</p>
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Sem timer', mins: 0 },
              { label: '30min', mins: 30 },
              { label: '1h', mins: 60 },
              { label: '2h', mins: 120 },
            ].map(t => (
              <Button
                key={t.mins}
                variant="outline"
                size="sm"
                className={`flex-1 text-xs ${
                  timerMinutes === t.mins && !timerActive
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                    : ''
                } ${timerActive ? 'pointer-events-none opacity-50' : ''}`}
                onClick={() => startTimer(t.mins)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          {timerActive && (
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => setTimerActive(false)}>
              Cancelar timer ({formatTimer(timerRemaining)})
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
