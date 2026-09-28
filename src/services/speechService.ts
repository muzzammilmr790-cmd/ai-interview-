// Web Speech API Service (SpeechSynthesis and SpeechRecognition)

// Extend Window interface for WebkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const TECHNICAL_JARGON_MAP: Array<[RegExp, string]> = [
  [/\b(virtual\s*dumb|virtual\s*don|virtual\s*dom)\b/gi, 'Virtual DOM'],
  [/\b(post\s*gre\s*s\s*q\s*l|post\s*grace|post\s*gres|postgre\s*sql)\b/gi, 'PostgreSQL'],
  [/\b(supa\s*base|super\s*base)\b/gi, 'Supabase'],
  [/\b(j\s*w\s*t|j-w-t|json\s*web\s*token)\b/gi, 'JWT'],
  [/\b(next\s*j\s*s|nextjs)\b/gi, 'Next.js'],
  [/\b(node\s*j\s*s|nodejs)\b/gi, 'Node.js'],
  [/\b(react\s*j\s*s|reactjs)\b/gi, 'React'],
  [/\b(type\s*script|typescript)\b/gi, 'TypeScript'],
  [/\b(java\s*script|javascript)\b/gi, 'JavaScript'],
  [/\b(graph\s*q\s*l|graphql)\b/gi, 'GraphQL'],
  [/\b(rest\s*a\s*p\s*i|restful\s*a\s*p\s*i|restful)\b/gi, 'REST API'],
  [/\b(web\s*socket|web\s*sockets)\b/gi, 'WebSockets'],
  [/\b(dock\s*er)\b/gi, 'Docker'],
  [/\b(coober\s*netes|kubernetis|k8s)\b/gi, 'Kubernetes'],
  [/\b(r\s*b\s*a\s*c)\b/gi, 'RBAC'],
  [/\b(r\s*l\s*s)\b/gi, 'RLS'],
  [/\b(s\s*s\s*r|server\s*side\s*rendering)\b/gi, 'Server-Side Rendering (SSR)'],
  [/\b(c\s*s\s*r|client\s*side\s*rendering)\b/gi, 'Client-Side Rendering (CSR)'],
  [/\b(c\s*s\s*s)\b/gi, 'CSS'],
  [/\b(h\s*t\s*m\s*l)\b/gi, 'HTML'],
  [/\b(d\s*o\s*m)\b/gi, 'DOM'],
  [/\b(tail\s*wind|tailwind\s*css)\b/gi, 'Tailwind CSS'],
  [/\b(re\s*dux)\b/gi, 'Redux'],
  [/\b(micro\s*services|microservices)\b/gi, 'Microservices'],
  [/\b(c\s*i\s*\/\s*c\s*d|ci\s*cd)\b/gi, 'CI/CD'],
  [/\b(o\s*auth|oauth\s*2)\b/gi, 'OAuth'],
  [/\b(x\s*s\s*s)\b/gi, 'XSS'],
  [/\b(c\s*s\s*r\s*f)\b/gi, 'CSRF'],
  [/\b(s\s*q\s*l\s*injection)\b/gi, 'SQL Injection'],
  [/\b(re\s*dis)\b/gi, 'Redis'],
  [/\b(mon\s*go\s*d\s*b|mongo\s*db)\b/gi, 'MongoDB'],
  [/\b(aws|amazon\s*web\s*services)\b/gi, 'AWS'],
  [/\b(star\s*method)\b/gi, 'STAR method'],
  [/\b(big\s*o)\b/gi, 'Big-O'],
  [/\b(hash\s*table|hash\s*map)\b/gi, 'Hash Table'],
];

export function correctTechnicalJargon(transcript: string): string {
  if (!transcript) return '';
  let corrected = transcript;
  for (const [pattern, canonical] of TECHNICAL_JARGON_MAP) {
    corrected = corrected.replace(pattern, canonical);
  }
  return corrected;
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public isRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  // Text-to-Speech (AI Speaking)
  public speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!this.isSynthesisSupported()) {
      onEnd?.();
      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  // Speech-to-Text (Candidate Recording)
  public startListening(
    onTranscriptUpdate: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser (Firefox / legacy engine). Automatic speech-to-text is disabled, but you can type or edit your response directly below.');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    let finalTranscript = '';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const combinedText = (finalTranscript + interimTranscript).trim();
      // Apply technical jargon correction automatically
      const correctedText = correctTechnicalJargon(combinedText);
      onTranscriptUpdate(correctedText, false);
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        onError?.(`Speech recognition notice: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      // Auto restart if intended to be listening
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          this.isListening = false;
        }
      }
    };

    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e) {
      this.isListening = false;
      onError?.('Failed to start speech recognition.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
  }
}

export const speechService = new SpeechService();
