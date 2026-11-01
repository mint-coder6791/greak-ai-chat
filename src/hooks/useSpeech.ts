import { useEffect, useRef, useState } from 'react';
import type { AppSettings } from '@/types';
import { buildSpeechQueue } from '@/lib/speechChunks';
import { fetchQwenSpeechUrl } from '@/lib/qwenTts';
import { errorMessage } from '@/lib/errors';

export type SpeechStatus = 'idle' | 'speaking' | 'paused';

export interface SpeechControls {
  status: SpeechStatus;
  activeMessageId: string | null;
  error: string | null;
  voices: SpeechSynthesisVoice[];
  supported: boolean;
  speak: (text: string, messageId: string) => void;
  stop: () => void;
  togglePause: () => void;
}

export function useSpeech(settings: AppSettings): SpeechControls {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const sessionRef = useRef(0);
  const queueRef = useRef<string[]>([]);
  const pausedRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    return audioRef.current;
  };

  const releaseAudio = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  };

  const halt = () => {
    sessionRef.current += 1;
    queueRef.current = [];
    pausedRef.current = false;
    utteranceRef.current = null;
    if (supported) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }
    releaseAudio();
    setStatus('idle');
    setActiveMessageId(null);
  };

  const playWithBrowser = (text: string, settings: AppSettings, session: number, onDone: () => void) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = synth.getVoices().find((v) => v.voiceURI === settings.browserVoiceURI);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.speechPitch;
    utterance.onend = () => {
      if (session !== sessionRef.current) return;
      utteranceRef.current = null;
      onDone();
    };
    utterance.onerror = (event) => {
      if (session !== sessionRef.current) return;
      utteranceRef.current = null;
      if (event.error === 'not-allowed') {
        setError('浏览器阻止了语音朗读，请先点击页面任意位置后再试');
        halt();
        return;
      }
      if (event.error !== 'canceled' && event.error !== 'interrupted') setError(`朗读出错：${event.error}`);
      onDone();
    };
    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const playAudioUrl = (fetchUrl: (signal: AbortSignal) => Promise<string>, session: number, onDone: () => void) => {
    const controller = new AbortController();
    requestRef.current = controller;
    fetchUrl(controller.signal)
      .then((url) => {
        if (session !== sessionRef.current) return;
        const audio = getAudio();
        audio.onended = () => {
          if (session === sessionRef.current) onDone();
        };
        audio.onerror = () => {
          if (session !== sessionRef.current) return;
          setError('语音音频无法播放');
          onDone();
        };
        audio.src = url;
        if (pausedRef.current) return;
        audio.play().catch(() => {
          if (session !== sessionRef.current) return;
          setError('浏览器阻止了自动播放，请点击喇叭按钮重试');
          halt();
        });
      })
      .catch((err: unknown) => {
        if (session !== sessionRef.current || controller.signal.aborted) return;
        setError(errorMessage(err));
        halt();
      });
  };

  const playNext = (session: number, settings: AppSettings) => {
    if (session !== sessionRef.current) return;
    const next = queueRef.current.shift();
    if (next === undefined) {
      setStatus('idle');
      setActiveMessageId(null);
      return;
    }
    const onDone = () => playNext(session, settings);
    if (settings.ttsEngine === 'browser') {
      playWithBrowser(next, settings, session, onDone);
    } else {
      playAudioUrl((signal) => fetchQwenSpeechUrl(settings, next, signal), session, onDone);
    }
  };

  const speakWith = (settings: AppSettings) => (text: string, messageId: string) => {
    if (settings.ttsEngine === 'browser' && !supported) {
      setError('当前浏览器不支持语音朗读');
      return;
    }
    const chunks = buildSpeechQueue(text, settings.chunkedReading);
    if (chunks.length === 0) return;
    halt();
    setError(null);
    queueRef.current = chunks;
    setActiveMessageId(messageId);
    setStatus('speaking');
    playNext(sessionRef.current, settings);
  };

  const togglePause = () => {
    if (status === 'speaking') {
      pausedRef.current = true;
      setStatus('paused');
      if (settings.ttsEngine === 'browser') window.speechSynthesis.pause();
      else audioRef.current?.pause();
    } else if (status === 'paused') {
      pausedRef.current = false;
      setStatus('speaking');
      if (settings.ttsEngine === 'browser') {
        window.speechSynthesis.resume();
      } else {
        const audio = audioRef.current;
        if (audio?.src && !audio.ended) {
          audio.play().catch(() => setError('无法继续播放'));
        }
      }
    }
  };

  useEffect(
    () => () => {
      halt();
      audioRef.current = null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    status,
    activeMessageId,
    error,
    voices,
    supported,
    speak: speakWith(settings),
    stop: halt,
    togglePause,
  };
}
