import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/lib/errors';

const DUCK_LEVEL = 0.2;
const DUCK_FADE_MS = 600;
const RESTORE_FADE_MS = 300;

export interface BgmOptions {
  url: string;
  volume: number;
  loop: boolean;
  duck: boolean;
  isSpeaking: boolean;
}

export interface BgmControls {
  playing: boolean;
  ducked: boolean;
  error: string | null;
  hasSource: boolean;
  localFileName: string | null;
  togglePlay: () => void;
  loadLocalFile: (file: File) => void;
  clearLocalFile: () => void;
}

export function useBgm({ url, volume, loop, duck, isSpeaking }: BgmOptions): BgmControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);

  const source = localUrl ?? url.trim();
  const ducked = duck && isSpeaking;

  useEffect(() => {
    if (!localUrl) return;
    return () => URL.revokeObjectURL(localUrl);
  }, [localUrl]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleError = () => {
      setPlaying(false);
      setError('无法加载这段音频，请确认链接是可直接播放的音频地址');
    };
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused;
    if (!source) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setError(null);
      return;
    }
    audio.src = source;
    setError(null);
    if (wasPlaying) {
      audio.play().catch((err: unknown) => setError(`无法播放：${errorMessage(err)}`));
    }
  }, [source]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  const target = Math.min(1, Math.max(0, volume)) * (ducked ? DUCK_LEVEL : 1);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const from = audio.volume;
    const duration = ducked ? DUCK_FADE_MS : RESTORE_FADE_MS;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = t * t * (3 - 2 * t);
      audio.volume = from + (target - from) * eased;
      if (t < 1) fadeFrameRef.current = requestAnimationFrame(tick);
    };
    fadeFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);
    };
  }, [target, ducked]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      setError('请先填写音频链接或上传本地音频');
      return;
    }
    if (audio.paused) {
      setError(null);
      audio.play().catch((err: unknown) => setError(`无法播放：${errorMessage(err)}`));
    } else {
      audio.pause();
    }
  }, []);

  const loadLocalFile = useCallback((file: File) => {
    setLocalUrl(URL.createObjectURL(file));
    setLocalFileName(file.name);
  }, []);

  const clearLocalFile = useCallback(() => {
    setLocalUrl(null);
    setLocalFileName(null);
  }, []);

  return {
    playing,
    ducked,
    error,
    hasSource: source.length > 0,
    localFileName,
    togglePlay,
    loadLocalFile,
    clearLocalFile,
  };
}
