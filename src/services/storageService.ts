import type { InterviewSession } from '../types/interview';
import { mediaStorageService } from './mediaStorageService';

const STORAGE_KEYS = {
  SESSIONS: 'jobpilot_ai_sessions_v1',
  API_KEY: 'jobpilot_ai_gemini_key',
  PROXY_URL: 'jobpilot_ai_proxy_url',
  MODEL: 'jobpilot_ai_gemini_model',
};

export const storageService = {
  getSessions(): InterviewSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
      return [];
    }
  },

  /**
   * Load session and hydrate recording URLs from IndexedDB if stored persistent keys are present.
   */
  async getHydratedSessionById(id: string): Promise<InterviewSession | null> {
    const session = this.getSessionById(id);
    if (!session) return null;

    const updatedAnswers = { ...session.answers };
    let modified = false;

    for (const qId of Object.keys(updatedAnswers)) {
      const ans = updatedAnswers[qId];
      if (ans && ans.recordingUrl) {
        if (ans.recordingUrl.startsWith('idb:') || ans.recordingUrl.startsWith('blob:')) {
          const freshUrl = await mediaStorageService.getRecordingUrl(session.id, qId);
          if (freshUrl) {
            updatedAnswers[qId] = { ...ans, recordingUrl: freshUrl };
            modified = true;
          }
        }
      }
    }

    return modified ? { ...session, answers: updatedAnswers } : session;
  },

  getSessionById(id: string): InterviewSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id) || null;
  },

  saveSession(session: InterviewSession): void {
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex((s) => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session); // Newest first
      }
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  },

  deleteSession(id: string): void {
    try {
      const sessions = this.getSessions().filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      mediaStorageService.deleteRecordingsForSession(id);
    } catch (e) {
      console.error('Failed to delete session', e);
    }
  },

  clearSessions(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      mediaStorageService.clearAllRecordings();
    } catch (e) {
      console.error('Failed to clear sessions', e);
    }
  },

  getApiKey(): string {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  },

  saveApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  },

  getProxyUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.PROXY_URL) || import.meta.env.VITE_GEMINI_PROXY_URL || '';
  },

  saveProxyUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.PROXY_URL, url.trim());
  },

  getGeminiModel(): string {
    return localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemini-2.5-flash';
  },

  saveGeminiModel(model: string): void {
    localStorage.setItem(STORAGE_KEYS.MODEL, model.trim());
  },

  getApiConfig() {
    return {
      apiKey: this.getApiKey(),
      proxyUrl: this.getProxyUrl(),
      model: this.getGeminiModel(),
    };
  },

  sanitizeError(error: any): string {
    const errStr = typeof error === 'string' ? error : error?.message || String(error);
    const key = this.getApiKey();
    if (key && key.length > 5) {
      return errStr.replaceAll(key, '***MASKED_KEY***').replace(/key=[a-zA-Z0-9_-]+/g, 'key=***MASKED_KEY***');
    }
    return errStr.replace(/key=[a-zA-Z0-9_-]+/g, 'key=***MASKED_KEY***');
  }
};
