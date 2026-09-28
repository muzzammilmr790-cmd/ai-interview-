import React, { useState } from 'react';
import { Bot, History, Sparkles, Key, Check, Eye, EyeOff, Trash2, ShieldCheck, Globe } from 'lucide-react';
import type { AppPhase } from '../types/interview';
import { storageService } from '../services/storageService';
import { Modal } from './Modal';

interface NavbarProps {
  currentPhase: AppPhase;
  onNavigate: (phase: AppPhase) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPhase, onNavigate }) => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(storageService.getApiKey());
  const [proxyUrlInput, setProxyUrlInput] = useState(storageService.getProxyUrl());
  const [showKeyText, setShowKeyText] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveConfig = () => {
    storageService.saveApiKey(apiKeyInput.trim());
    storageService.saveProxyUrl(proxyUrlInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setShowApiKeyModal(false);
    }, 1000);
  };

  const handleClearConfig = () => {
    storageService.saveApiKey('');
    storageService.saveProxyUrl('');
    setApiKeyInput('');
    setProxyUrlInput('');
    setIsSaved(false);
  };

  const isConfigActive = !!(storageService.getApiKey() || storageService.getProxyUrl());

  return (
    <nav className="sticky top-0 z-40 bento-panel border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('setup')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              JobPilot <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/30">AI MOCK</span>
            </div>
            <p className="text-xs text-slate-400">Interactive Video Interview Simulator</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('setup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              currentPhase === 'setup'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            New Interview
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              currentPhase === 'history'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            Past Sessions
          </button>

          {/* API Key Modal Trigger */}
          <button
            onClick={() => {
              setApiKeyInput(storageService.getApiKey());
              setProxyUrlInput(storageService.getProxyUrl());
              setShowApiKeyModal(true);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              isConfigActive
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
            }`}
            title="Configure Gemini API or Proxy Endpoint"
          >
            <Key className="w-3.5 h-3.5" />
            {isConfigActive ? 'AI Connected' : 'Demo Mode'}
          </button>
        </div>
      </div>

      {/* API Key & Proxy Settings Modal */}
      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title={
          <span className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-amber-400" />
            AI Service Security &amp; Endpoint Settings
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Configure your Gemini API key or backend proxy URL for live AI evaluations. Keys are transmitted securely via HTTP headers (<code className="text-emerald-400 font-mono">x-goog-api-key</code>) to prevent query string URL exposure.
          </p>

          {/* Direct API Key Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Gemini API Key (Passed via Secure Header)
            </label>
            <div className="relative">
              <input
                type={showKeyText ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKeyText(!showKeyText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                title={showKeyText ? 'Hide Key' : 'Show Key'}
              >
                {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Backend Proxy Endpoint Option */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Custom Backend Proxy Endpoint (Optional)
            </label>
            <input
              type="text"
              placeholder="https://api.yourdomain.com/v1/gemini-proxy"
              value={proxyUrlInput}
              onChange={(e) => setProxyUrlInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If configured, requests route through your secure backend proxy without storing keys in browser client state.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {isConfigActive ? (
              <button
                onClick={handleClearConfig}
                className="px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Configuration
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved Settings!
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </nav>
  );
};

