import { soundFx } from './audioSynth';
import { deviceBridge } from './deviceBridge';

export type SpeechCallback = (transcript: string, isFinal: boolean) => void;
export type StatusCallback = (isListening: boolean) => void;

class JarvisSpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  public language: 'hi-IN' | 'en-IN' | 'en-US' = 'hi-IN'; // Default Hindi/Hinglish
  public useGeminiTts: boolean = true;
  public ttsVoice: string = 'Puck'; // Gemini voice: Puck, Zephyr, Charon, Fenrir, Kore

  // Subtle physical haptic feedback patterns
  private triggerSpeechStartHaptic() {
    // Subtle double-pulse when Jarvis initiates transmission
    deviceBridge.vibrate([28, 35, 28]);
  }

  private triggerSpeechEndHaptic() {
    // Crisp single pulse when Jarvis completes transmission
    deviceBridge.vibrate(30);
  }

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;
      }
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  public setLanguage(lang: 'hi-IN' | 'en-IN' | 'en-US') {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(onResult: SpeechCallback, onStatusChange: StatusCallback, onError?: (err: string) => void) {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        if (onError) onError('Speech Recognition is not supported on this browser. Please use Chrome on Android.');
        return;
      }
    }

    // Stop ongoing speech when user activates microphone
    this.stopSpeaking();

    try {
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        soundFx.playListeningStart();
        onStatusChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        this.isListening = false;
        onStatusChange(false);
        if (event.error !== 'no-speech' && onError) {
          onError(`Speech recognition: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        soundFx.playListeningStop();
        onStatusChange(false);
      };

      this.recognition.start();
    } catch (err: any) {
      console.warn('Recognition start error:', err);
      this.isListening = false;
      onStatusChange(false);
      if (onError) onError(err.message || 'Microphone access failed');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Stop recognition error:', e);
      }
      this.isListening = false;
    }
  }

  public stopSpeaking() {
    // Stop server audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    // Stop native speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Speak aloud via Gemini TTS or Browser SpeechSynthesis
  public async speak(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
    this.stopSpeaking();
    if (!text || !text.trim()) return;

    let hasStarted = false;
    const handleSpeechStart = () => {
      if (!hasStarted) {
        hasStarted = true;
        this.triggerSpeechStartHaptic();
        if (onStart) onStart();
      }
    };

    const handleSpeechEnd = () => {
      this.triggerSpeechEndHaptic();
      if (onEnd) onEnd();
    };

    // If Gemini TTS is enabled, attempt high quality server-side synthesis
    if (this.useGeminiTts) {
      try {
        const response = await fetch('/api/jarvis/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: this.ttsVoice }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.audioUrl) {
            const audio = new Audio(data.audioUrl);
            this.currentAudio = audio;
            audio.onplay = () => {
              handleSpeechStart();
            };
            audio.onended = () => {
              this.currentAudio = null;
              handleSpeechEnd();
            };
            audio.onerror = () => {
              this.fallbackSpeak(text, onStart, onEnd);
            };
            // Trigger start haptic right before playback for instant tactile response
            handleSpeechStart();
            await audio.play();
            return;
          }
        }
      } catch (e) {
        console.warn('Server TTS failed, falling back to browser synthesis:', e);
      }
    }

    // Fallback to Browser SpeechSynthesis
    this.fallbackSpeak(text, onStart, onEnd);
  }

  private fallbackSpeak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Try finding an English or Hindi male/AI voice
    const preferredVoice =
      voices.find((v) => v.lang.includes('IN') || v.name.includes('India')) ||
      voices.find((v) => v.name.includes('Daniel') || v.name.includes('Google UK English Male')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.05;
    utterance.pitch = 0.95; // Slightly lower pitch for Jarvis persona

    utterance.onstart = () => {
      this.triggerSpeechStartHaptic();
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.triggerSpeechEndHaptic();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.triggerSpeechEndHaptic();
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const speechEngine = new JarvisSpeechEngine();
