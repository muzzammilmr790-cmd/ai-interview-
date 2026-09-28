import React, { useState } from 'react';
import { 
  Code2, 
  Layers, 
  Network, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  Briefcase,
  Play
} from 'lucide-react';
import type { InterviewConfig, InterviewCategory, DifficultyLevel } from '../types/interview';

interface SetupScreenProps {
  onStartInterview: (config: InterviewConfig) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartInterview }) => {
  const [roleTitle, setRoleTitle] = useState('Full-Stack React Developer');
  const [category, setCategory] = useState<InterviewCategory>('frontend');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('mid');
  const [questionCount, setQuestionCount] = useState(3);
  const [timePerQuestion, setTimePerQuestion] = useState(90);
  const [customJobDescription, setCustomJobDescription] = useState('');

  const categories = [
    {
      id: 'frontend',
      title: 'Frontend & Web Dev',
      desc: 'React 19, JavaScript/TypeScript, DOM, Performance & Web APIs',
      icon: Code2,
      color: 'from-emerald-400 to-teal-600'
    },
    {
      id: 'fullstack',
      title: 'Full-Stack & Backend',
      desc: 'Node.js, PostgreSQL/Supabase, REST, RBAC & Security',
      icon: Layers,
      color: 'from-cyan-400 to-blue-600'
    },
    {
      id: 'dsa',
      title: 'Algorithms & DSA',
      desc: 'Arrays, Trees, Graphs, Hash Tables & Complexity',
      icon: Network,
      color: 'from-teal-400 to-emerald-600'
    },
    {
      id: 'behavioral',
      title: 'Behavioral & HR',
      desc: 'STAR method, Leadership, Teamwork & Situational Scenarios',
      icon: MessageSquare,
      color: 'from-sky-400 to-indigo-600'
    }
  ];

  const difficulties: { id: DifficultyLevel; label: string; badge: string }[] = [
    { id: 'junior', label: 'Junior / Entry', badge: '0-2 Yrs Experience' },
    { id: 'mid', label: 'Mid-Level Developer', badge: '2-5 Yrs Experience' },
    { id: 'senior', label: 'Senior Engineer', badge: '5+ Yrs Experience' },
    { id: 'lead', label: 'Tech Lead / Architect', badge: 'Strategic & System Depth' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview({
      roleTitle,
      category,
      difficulty,
      questionCount,
      timePerQuestion,
      customJobDescription: customJobDescription.trim() || undefined
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          AI VOICE & VIDEO MOCK ROOM
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Configure Your Mock Interview
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Tailor your role, difficulty, and questions. Get realistic camera-to-camera interview practice with instant AI scorecards.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Role Title Input */}
        <div className="bento-panel p-6 rounded-2xl">
          <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            Target Role Title
          </label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g. Senior Full-Stack Engineer, React Developer"
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm font-medium"
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            Select Primary Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setCategory(cat.id as InterviewCategory)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bento-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-tr ${cat.color} text-slate-950 shadow-md font-bold`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base mb-1">{cat.title}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            Select Target Difficulty
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {difficulties.map((diff) => {
              const isSelected = difficulty === diff.id;
              return (
                <button
                  type="button"
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{diff.label}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{diff.badge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count & Time Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Question Count */}
          <div className="bento-panel p-6 rounded-2xl">
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Number of Questions
            </label>
            <div className="flex items-center gap-3">
              {[1, 3, 5, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                    questionCount === num
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num} {num === 1 ? 'Q' : 'Qs'}
                </button>
              ))}
            </div>
          </div>

          {/* Time Per Question */}
          <div className="bento-panel p-6 rounded-2xl">
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Time Per Question
            </label>
            <div className="flex items-center gap-2">
              {[
                { sec: 60, label: '60s' },
                { sec: 90, label: '90s' },
                { sec: 120, label: '120s' },
                { sec: 0, label: 'No Limit' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.sec}
                  onClick={() => setTimePerQuestion(item.sec)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all ${
                    timePerQuestion === item.sec
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Job Description Input */}
        <div className="bento-panel p-6 rounded-2xl">
          <label className="block text-sm font-semibold text-white mb-2">
            Custom Job Description (Optional)
          </label>
          <textarea
            value={customJobDescription}
            onChange={(e) => setCustomJobDescription(e.target.value)}
            rows={3}
            placeholder="Paste a job description to generate hyper-targeted questions for specific frameworks, tools, or requirements..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Launch Button */}
        <div className="text-center pt-2">
          <button
            type="submit"
            className="btn-gradient w-full sm:w-auto px-10 py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-3 mx-auto shadow-xl"
          >
            <Play className="w-5 h-5 fill-current" />
            Launch Live Interview Room
          </button>
        </div>

      </form>
    </div>
  );
};
