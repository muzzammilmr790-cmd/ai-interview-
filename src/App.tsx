import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SetupScreen } from './components/SetupScreen';
import { InterviewRoom } from './components/InterviewRoom';
import { ScorecardScreen } from './components/ScorecardScreen';
import { HistoryScreen } from './components/HistoryScreen';

import type { 
  AppPhase, 
  InterviewConfig, 
  Question, 
  CandidateAnswer, 
  QuestionEvaluation, 
  InterviewSession 
} from './types/interview';

import { aiService } from './services/aiService';
import { storageService } from './services/storageService';
import { Bot, Sparkles } from 'lucide-react';

export function App() {
  const [phase, setPhase] = useState<AppPhase>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);

  // Handle Launching Interview
  const handleStartInterview = async (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setPhase('evaluating'); // Show brief loading skeleton

    try {
      const generatedQuestions = await aiService.generateQuestions(newConfig);
      setQuestions(generatedQuestions);
      setPhase('interview');
    } catch (e) {
      console.error('Failed to generate questions:', e);
      setPhase('setup');
    }
  };

  // Handle Interview Completion & Evaluation
  const handleFinishInterview = async (answers: Record<string, CandidateAnswer>) => {
    if (!config || questions.length === 0) return;

    setPhase('evaluating');

    const evaluations: Record<string, QuestionEvaluation> = {};
    let totalScore = 0;
    let totalTech = 0;
    let totalClarity = 0;
    let totalComp = 0;

    // Parallelize evaluations using Promise.all for instant response
    const evaluationPromises = questions.map(async (q) => {
      const candidateAnswer = answers[q.id];
      const transcript = candidateAnswer?.transcript || '';
      const evalResult = await aiService.evaluateAnswer(q, transcript, config);
      return { questionId: q.id, evalResult };
    });

    const evalResults = await Promise.all(evaluationPromises);

    for (const { questionId, evalResult } of evalResults) {
      evaluations[questionId] = evalResult;

      totalScore += evalResult.score;
      totalTech += evalResult.technicalAccuracy;
      totalClarity += evalResult.clarity;
      totalComp += evalResult.completeness;
    }

    const count = questions.length;
    const avgScore = Math.round(totalScore / count);
    const avgTech = Math.round(totalTech / count);
    const avgClarity = Math.round(totalClarity / count);
    const avgComp = Math.round(totalComp / count);

    // Build Session Object
    const session: InterviewSession = {
      id: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
      config,
      questions,
      answers,
      evaluations,
      overallScore: avgScore,
      averageMetrics: {
        technicalAccuracy: avgTech,
        clarity: avgClarity,
        completeness: avgComp,
      },
      summary: {
        strengths: [
          'Demonstrated clear technical vocabulary and concept awareness',
          'Responded promptly under realistic video call conditions',
          'Good overall structure in explanation',
        ],
        improvements: [
          'Incorporate concrete trade-off comparisons (e.g. Memory vs CPU)',
          'Mention framework-specific APIs and code design patterns',
        ],
        overallVerdict: avgScore >= 80 
          ? 'Strong Candidate - Ready for Technical On-Site'
          : avgScore >= 60 
          ? 'Competent Candidate - Solid Fundamentals with minor gaps'
          : 'Developing Candidate - Needs focused revision on core concepts',
      },
    };

    // Persist to LocalStorage
    storageService.saveSession(session);
    setCurrentSession(session);
    setPhase('scorecard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1d] text-slate-100 relative selection:bg-emerald-400 selection:text-slate-950">
      
      {/* Background Radial Glows */}
      <div className="ambient-bg" />

      {/* Top Navbar */}
      <Navbar 
        currentPhase={phase} 
        onNavigate={(newPhase) => {
          if (newPhase === 'setup') setCurrentSession(null);
          setPhase(newPhase);
        }} 
      />

      {/* Main Content Render Area */}
      <main className="flex-1 relative z-10">
        
        {/* SETUP PHASE */}
        {phase === 'setup' && (
          <SetupScreen onStartInterview={handleStartInterview} />
        )}

        {/* INTERVIEW PHASE */}
        {phase === 'interview' && questions.length > 0 && config && (
          <InterviewRoom
            questions={questions}
            timePerQuestion={config.timePerQuestion}
            onFinishInterview={handleFinishInterview}
          />
        )}

        {/* EVALUATING LOADING PHASE */}
        {phase === 'evaluating' && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce mb-6">
              <Bot className="w-9 h-9 text-slate-950 font-bold" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              Evaluating Candidate Performance...
            </h2>
            <p className="text-xs text-slate-400 max-w-sm">
              Analyzing technical accuracy, communication clarity, and problem-solving depth across your spoken responses.
            </p>
          </div>
        )}

        {/* SCORECARD PHASE */}
        {phase === 'scorecard' && currentSession && (
          <ScorecardScreen
            session={currentSession}
            onNewInterview={() => setPhase('setup')}
            onViewHistory={() => setPhase('history')}
          />
        )}

        {/* HISTORY PHASE */}
        {phase === 'history' && (
          <HistoryScreen
            onSelectSession={(sess) => {
              setCurrentSession(sess);
              setPhase('scorecard');
            }}
            onNewInterview={() => setPhase('setup')}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 relative z-10">
        JobPilot AI &copy; 2026 • Interactive Video &amp; Voice Mock Interviewer
      </footer>

    </div>
  );
}

export default App;
