export type InterviewCategory = 'frontend' | 'fullstack' | 'dsa' | 'system-design' | 'behavioral';

export type DifficultyLevel = 'junior' | 'mid' | 'senior' | 'lead';

export interface InterviewConfig {
  category: InterviewCategory;
  difficulty: DifficultyLevel;
  questionCount: number;
  timePerQuestion: number; // in seconds, 0 = unlimited
  customJobDescription?: string;
  roleTitle: string;
}

export interface Question {
  id: string;
  text: string;
  category: InterviewCategory;
  difficulty: DifficultyLevel;
  hint?: string;
  benchmarkAnswer?: string;
}

export interface CandidateAnswer {
  questionId: string;
  transcript: string;
  durationSeconds: number;
  submittedAt: string;
  recordingUrl?: string;
  mediaType?: string;
}

export interface QuestionEvaluation {
  questionId: string;
  score: number; // 0-100
  technicalAccuracy: number; // 0-100
  clarity: number; // 0-100
  completeness: number; // 0-100
  feedback: string;
  deliveryFeedback?: string;
  whatWentWell: string[];
  areasToImprove: string[];
  benchmarkAnswer: string;
}

export interface InterviewSession {
  id: string;
  timestamp: string;
  config: InterviewConfig;
  questions: Question[];
  answers: Record<string, CandidateAnswer>;
  evaluations: Record<string, QuestionEvaluation>;
  overallScore: number;
  averageMetrics: {
    technicalAccuracy: number;
    clarity: number;
    completeness: number;
  };
  summary: {
    strengths: string[];
    improvements: string[];
    overallVerdict: string;
  };
}

export type AppPhase = 'setup' | 'interview' | 'evaluating' | 'scorecard' | 'history';

export interface CameraState {
  hasCameraPermission: boolean;
  hasMicPermission: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  error?: string;
}
