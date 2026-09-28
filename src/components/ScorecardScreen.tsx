import React from 'react';
import { 
  Trophy, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  MessageSquare, 
  Sparkles, 
  RotateCcw, 
  History,
  BookOpen,
  Video
} from 'lucide-react';
import type { InterviewSession } from '../types/interview';

interface ScorecardScreenProps {
  session: InterviewSession;
  onNewInterview: () => void;
  onViewHistory: () => void;
}

export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  session,
  onNewInterview,
  onViewHistory,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      
      {/* Header Banner */}
      <div className="bento-panel p-8 rounded-3xl border border-emerald-500/20 text-center relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider mb-4">
          <Trophy className="w-4 h-4 text-emerald-400" />
          INTERVIEW EVALUATION COMPLETED
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Your Performance Scorecard
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
          Role: <strong className="text-slate-200">{session.config.roleTitle}</strong> • Category: <span className="uppercase text-emerald-400 font-mono font-semibold">{session.config.category}</span>
        </p>

        {/* Big Score Circle */}
        <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-emerald-500/40 bg-slate-950/80 shadow-2xl my-2">
          <span className="text-4xl font-black text-white">{session.overallScore}</span>
          <span className="text-xs text-emerald-400 uppercase tracking-widest font-mono font-semibold mt-1">Out of 100</span>
        </div>

        {/* Verdict Badge */}
        <div className="mt-4">
          <span className={`inline-block px-4 py-1.5 rounded-md text-xs font-bold border ${getScoreColor(session.overallScore)} font-mono`}>
            {session.summary.overallVerdict || 'Strong Candidate - Solid Core Knowledge'}
          </span>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Technical Accuracy */}
        <div className="bento-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Target className="w-4 h-4 text-emerald-400" />
              Technical Accuracy
            </span>
            <span className="text-lg font-extrabold text-white">{session.averageMetrics.technicalAccuracy}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${session.averageMetrics.technicalAccuracy}%` }}
            />
          </div>
        </div>

        {/* Communication Clarity */}
        <div className="bento-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Communication &amp; Clarity
            </span>
            <span className="text-lg font-extrabold text-white">{session.averageMetrics.clarity}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
              style={{ width: `${session.averageMetrics.clarity}%` }}
            />
          </div>
        </div>

        {/* Completeness */}
        <div className="bento-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Completeness
            </span>
            <span className="text-lg font-extrabold text-white">{session.averageMetrics.completeness}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${session.averageMetrics.completeness}%` }}
            />
          </div>
        </div>

      </div>

      {/* Strengths vs Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Key Strengths */}
        <div className="bento-panel p-6 rounded-2xl border-l-4 border-emerald-400">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Key Strengths Observed
          </h3>
          <ul className="space-y-2.5">
            {session.summary.strengths.map((str, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                {str}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Focus Areas */}
        <div className="bento-panel p-6 rounded-2xl border-l-4 border-amber-400">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Areas for Growth &amp; Refinement
          </h3>
          <ul className="space-y-2.5">
            {session.summary.improvements.map((imp, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {imp}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Detailed Question Review List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Question-by-Question Evaluation Breakdown
        </h3>

        <div className="space-y-4">
          {session.questions.map((question, index) => {
            const answer = session.answers[question.id];
            const evalResult = session.evaluations[question.id];

            return (
              <div key={question.id} className="bento-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      Question {index + 1}
                    </span>
                    <h4 className="text-base font-bold text-white leading-snug">
                      {question.text}
                    </h4>
                  </div>
                  {evalResult && (
                    <span className={`px-3 py-1 rounded-md text-xs font-mono font-extrabold border ${getScoreColor(evalResult.score)} shrink-0`}>
                      {evalResult.score} / 100
                    </span>
                  )}
                </div>

                {/* Candidate Answer */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold block mb-1">
                    Your Spoken Response
                  </span>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{answer?.transcript || 'No response provided'}"
                  </p>

                  {/* Recorded Video Playback */}
                  {answer?.recordingUrl && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-400 font-mono">
                        <Video className="w-4 h-4 text-emerald-400" />
                        Recorded Video/Audio Playback:
                      </div>
                      <video
                        src={answer.recordingUrl}
                        controls
                        className="w-full max-h-60 rounded-xl bg-black border border-slate-800 object-contain shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* Ideal Benchmark Answer */}
                {evalResult?.benchmarkAnswer && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono font-bold block mb-1">
                      Ideal Benchmark Answer
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {evalResult.benchmarkAnswer}
                    </p>
                  </div>
                )}

                {/* AI Feedback */}
                {evalResult && (
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <strong className="text-slate-200 font-semibold">AI Interrogator Note:</strong> {evalResult.feedback}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={onNewInterview}
          className="btn-gradient px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start Another Mock Interview
        </button>

        <button
          onClick={onViewHistory}
          className="px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold flex items-center gap-2"
        >
          <History className="w-4 h-4 text-cyan-400" />
          View Saved Sessions
        </button>
      </div>

    </div>
  );
};
