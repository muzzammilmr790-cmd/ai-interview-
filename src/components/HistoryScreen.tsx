import React, { useState, useEffect } from 'react';
import { History, Trophy, Calendar, Trash2, ArrowRight, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import type { InterviewSession } from '../types/interview';
import { storageService } from '../services/storageService';
import { Modal } from './Modal';

interface HistoryScreenProps {
  onSelectSession: (session: InterviewSession) => void;
  onNewInterview: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onSelectSession,
  onNewInterview,
}) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    setSessions(storageService.getSessions());
  }, []);

  const confirmDeleteSingle = () => {
    if (!sessionToDelete) return;
    storageService.deleteSession(sessionToDelete);
    setSessions(storageService.getSessions());
    setSessionToDelete(null);
  };

  const confirmClearAll = () => {
    storageService.clearSessions();
    setSessions([]);
    setShowClearAllModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bento-panel p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold mb-2">
            <History className="w-3.5 h-3.5" />
            INTERVIEW HISTORY LOG
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Past Mock Sessions
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Review your scores, feedback, and skill progression stored locally in your browser.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {sessions.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Logs
            </button>
          )}

          <button
            onClick={onNewInterview}
            className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Start New Mock
          </button>
        </div>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="bento-panel p-12 rounded-3xl text-center space-y-4 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Saved Sessions Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Complete your first mock video interview to start building your score history!
          </p>
          <button
            onClick={onNewInterview}
            className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
          >
            Launch First Mock Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const dateStr = new Date(sess.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sess.id}
                onClick={() => onSelectSession(sess)}
                className="bento-card p-6 rounded-2xl cursor-pointer border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {sess.config.roleTitle}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
                      {sess.config.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {dateStr}
                    </span>
                    <span>• {sess.config.questionCount} Questions</span>
                    <span className="capitalize">• {sess.config.difficulty} Level</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Score Pill */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-extrabold text-white font-mono">{sess.overallScore} / 100</span>
                  </div>

                  {/* Delete Action Trigger Modal */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(sess.id);
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete Session Log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Single Session Modal */}
      <Modal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        title={
          <span className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Delete Interview Session Log?
          </span>
        }
      >
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Are you sure you want to delete this saved interview scorecard? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setSessionToDelete(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteSingle}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-lg shadow-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Session
          </button>
        </div>
      </Modal>

      {/* Clear All Sessions Modal */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title={
          <span className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Clear All Saved History?
          </span>
        }
      >
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Are you sure you want to delete all saved interview sessions from your browser storage? This will clear your entire score history.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowClearAllModal(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={confirmClearAll}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-lg shadow-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        </div>
      </Modal>

    </div>
  );
};

