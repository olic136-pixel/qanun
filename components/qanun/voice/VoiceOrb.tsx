'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, Mic, MicOff } from 'lucide-react';

// Minimal local types for the Web Speech API (not universally typed in TS DOM lib)
interface ISpeechRecognitionResult {
  readonly length: number;
  item(index: number): { transcript: string };
  [index: number]: { transcript: string };
}
interface ISpeechRecognitionResultList {
  readonly length: number;
  readonly resultIndex: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}
type WindowWithSpeech = Window & {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
};

interface VoiceOrbProps {
  onTranscription: (text: string) => void;
  onLivePreview?: (text: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  onClearInput?: () => void;
}

type OrbState = 'idle' | 'recording' | 'processing';

export function VoiceOrb({
  onTranscription,
  onLivePreview,
  onError,
  disabled,
  onClearInput,
}: VoiceOrbProps) {
  const [orbState, setOrbState] = useState<OrbState>('idle');

  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const SpeechRecognitionAPI: ISpeechRecognitionConstructor | null =
    typeof window !== 'undefined'
      ? ((window as WindowWithSpeech).SpeechRecognition ??
          (window as WindowWithSpeech).webkitSpeechRecognition ??
          null)
      : null;

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript && onLivePreview) {
        onLivePreview(transcript);
      }
    };
    recognition.onerror = () => {
      // Silent — WebSpeech failure must not affect recording or Whisper
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionAPI, onLivePreview]);

  const stopRecording = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    stopRecognition();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setOrbState('processing');
  }, [stopRecognition]);

  const startRecording = useCallback(async () => {
    onClearInput?.();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/mp4';

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];

      if (blob.size < 100) {
        setOrbState('idle');
        return;
      }

      const form = new FormData();
      form.append('audio', blob);

      try {
        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          onError('Transcription failed. Please try again.');
          setOrbState('idle');
          return;
        }
        const { text } = await res.json();
        onTranscription(text);
      } catch {
        onError('Transcription failed. Please try again.');
      }
      setOrbState('idle');
    };

    recorder.start(100);
    startRecognition();
    setOrbState('recording');

    maxTimerRef.current = setTimeout(() => {
      stopRecording();
    }, 60_000);
  }, [onClearInput, onError, onTranscription, startRecognition, stopRecording]);

  const handlePress = useCallback(() => {
    if (orbState === 'idle') {
      startRecording();
    } else if (orbState === 'recording') {
      stopRecording();
    }
  }, [orbState, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      stopRecognition();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopRecognition]);

  const ariaLabel =
    orbState === 'recording'
      ? 'Stop recording'
      : orbState === 'processing'
      ? 'Processing audio'
      : 'Start recording';

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={disabled || orbState === 'processing'}
      aria-label={ariaLabel}
      aria-pressed={orbState === 'recording'}
      className={[
        'w-10 h-10 flex items-center justify-center shrink-0 transition-colors',
        orbState === 'recording'
          ? 'bg-[#0047FF] text-white'
          : orbState === 'processing' || disabled
          ? 'bg-black/20 text-white/50 cursor-not-allowed'
          : 'bg-black text-white hover:bg-[#0047FF] cursor-pointer',
      ].join(' ')}
    >
      {orbState === 'processing' ? (
        <Loader2 size={16} className="animate-spin" />
      ) : orbState === 'recording' ? (
        <MicOff size={16} />
      ) : (
        <Mic size={16} />
      )}
    </button>
  );
}
