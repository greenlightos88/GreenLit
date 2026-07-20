/**
 * Voice input/output wrapper for the assistant.
 *
 * Speech recognition and synthesis are progressive enhancements: when the
 * browser does not expose them, the assistant remains fully usable by text
 * (constitution 9.2 — core work never depends on optional platform features).
 */

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isVoiceInputAvailable(): boolean {
  return recognitionConstructor() !== undefined;
}

export interface RecognitionHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

/** Start one listening session. Returns a stop function; no-op when unavailable. */
export function startListening(handlers: RecognitionHandlers): () => void {
  const Ctor = recognitionConstructor();
  if (!Ctor) {
    handlers.onError("Voice input is not available in this browser.");
    handlers.onEnd();
    return () => {};
  }
  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result) continue;
      if (result.isFinal) {
        handlers.onFinal(result[0].transcript.trim());
      } else {
        interim += result[0].transcript;
      }
    }
    if (interim) handlers.onInterim(interim.trim());
  };
  recognition.onend = () => handlers.onEnd();
  recognition.onerror = (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    handlers.onError(
      event.error === "not-allowed"
        ? "Microphone access was declined."
        : `Voice input failed (${event.error ?? "unknown error"}).`,
    );
  };
  recognition.start();
  return () => recognition.abort();
}

export function isVoiceOutputAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak a reply aloud, cancelling any reply still in progress. */
export function speak(text: string): void {
  if (!isVoiceOutputAvailable()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isVoiceOutputAvailable()) window.speechSynthesis.cancel();
}
