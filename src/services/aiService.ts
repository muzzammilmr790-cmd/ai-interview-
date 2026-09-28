import type { InterviewConfig, Question, QuestionEvaluation } from '../types/interview';
import { storageService } from './storageService';

// Built-in high quality question database for instant demo/offline mode
const PRESET_QUESTIONS: Record<string, Question[]> = {
  frontend: [
    {
      id: 'fe-1',
      text: 'Explain the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR). When would you choose one over the other?',
      category: 'frontend',
      difficulty: 'mid',
      hint: 'Think about initial page load speed (FCP), SEO indexing, server CPU overhead, and client-side interactivity.',
      benchmarkAnswer: 'SSR renders HTML on the server for faster First Contentful Paint and superior SEO, while CSR handles rendering in the browser, providing rich dynamic interactions once initial JavaScript loads.'
    },
    {
      id: 'fe-2',
      text: 'How does the React Virtual DOM work, and how does React 19 / Fiber reconcile state changes efficiently?',
      category: 'frontend',
      difficulty: 'senior',
      hint: 'Discuss diffing algorithm, key props, fiber nodes, and concurrent rendering prioritization.',
      benchmarkAnswer: 'React maintains an in-memory Virtual DOM tree. When state changes, it creates a new tree and computes a diff (reconciliation) using heuristic tree comparison to make minimal mutations to the real DOM.'
    },
    {
      id: 'fe-3',
      text: 'What is Debouncing vs Throttling in JavaScript, and how would you implement a custom useDebounce hook in React?',
      category: 'frontend',
      difficulty: 'mid',
      hint: 'Debouncing delays execution until a timer resets on user activity; Throttling enforces a maximum execution frequency.',
      benchmarkAnswer: 'Debouncing waits for a pause in activity before firing (e.g. search inputs), while throttling guarantees execution at fixed intervals (e.g. scroll listeners).'
    },
    {
      id: 'fe-4',
      text: 'What are CSS Custom Properties (CSS variables) and how do you implement clean dark/light theme switching with smooth transitions?',
      category: 'frontend',
      difficulty: 'junior',
      hint: 'Mention :root variables, data-theme HTML attribute, and localStorage persistence.',
      benchmarkAnswer: 'CSS variables allow centralized design system tokens. Theme toggling dynamically updates data-theme attributes on html/body while persisting user choice in localStorage.'
    }
  ],
  fullstack: [
    {
      id: 'fs-1',
      text: 'How do you secure API routes against unauthorized access using Role-Based Access Control (RBAC) and Row Level Security (RLS)?',
      category: 'fullstack',
      difficulty: 'senior',
      hint: 'Mention JWT claims, middleware route guards, and database-level security policies (e.g., PostgreSQL / Supabase RLS).',
      benchmarkAnswer: 'RBAC enforces authorization at API routes via JWT roles, while Row Level Security (RLS) enforces database-level row permissions directly in PostgreSQL policies.'
    },
    {
      id: 'fs-2',
      text: 'Describe how HTTP WebSockets differ from REST APIs. In what scenarios would you choose WebSockets?',
      category: 'fullstack',
      difficulty: 'mid',
      hint: 'Contrast unidirectional request-response cycles with bi-directional persistent TCP connections.',
      benchmarkAnswer: 'REST uses stateless HTTP request-response cycles, whereas WebSockets establish persistent bi-directional TCP connections ideal for real-time chat, live feeds, or collaborative tools.'
    },
    {
      id: 'fs-3',
      text: 'How do you prevent SQL Injection and Cross-Site Scripting (XSS) in modern full-stack web applications?',
      category: 'fullstack',
      difficulty: 'mid',
      hint: 'Mention parameterized queries, ORMs, HTML sanitization, Content Security Policy (CSP), and React automatic escaping.',
      benchmarkAnswer: 'Prevent SQL injection via parameterized queries or ORMs; prevent XSS using context-aware HTML escaping, CSP headers, and avoiding raw innerHTML injection.'
    }
  ],
  dsa: [
    {
      id: 'dsa-1',
      text: 'Explain how a Hash Table achieves O(1) average lookup time. How are collisions handled?',
      category: 'dsa',
      difficulty: 'mid',
      hint: 'Discuss hash functions, bucket indexing, separate chaining (linked lists), and open addressing.',
      benchmarkAnswer: 'Hash tables map keys to array indexes using a hash function. Collisions are managed via separate chaining (linked lists/trees at buckets) or open addressing (linear probing).'
    },
    {
      id: 'dsa-2',
      text: 'Compare Breadth-First Search (BFS) and Depth-First Search (DFS). When is BFS preferred over DFS?',
      category: 'dsa',
      difficulty: 'mid',
      hint: 'Think about queue vs stack (recursion), finding shortest paths in unweighted graphs, and memory usage.',
      benchmarkAnswer: 'BFS uses a Queue to explore neighbor nodes level-by-level, making it ideal for shortest path in unweighted graphs. DFS uses a Stack/recursion to explore deep paths first.'
    }
  ],
  'system-design': [
    {
      id: 'sd-1',
      text: 'How would you design a high-throughput URL shortening service like Bit.ly to handle millions of redirects per day?',
      category: 'system-design',
      difficulty: 'senior',
      hint: 'Discuss base62 encoding of auto-increment IDs or MD5 hashes, Redis caching layer, database choice, and HTTP 301 vs 302 redirects.',
      benchmarkAnswer: 'Use Base62 encoding on unique IDs, cache hot URLs in Redis for fast 301/302 redirects, and use horizontal database sharding for scalability.'
    }
  ],
  behavioral: [
    {
      id: 'beh-1',
      text: 'Tell me about a time you encountered a tight deadline or high-pressure bug in production. How did you prioritize and resolve it?',
      category: 'behavioral',
      difficulty: 'junior',
      hint: 'Use the STAR method: Situation, Task, Action, Result. Emphasize communication, triage, and post-mortem.',
      benchmarkAnswer: 'Structured STAR response detailing clear bug isolation, transparent stakeholder communication, fix deployment, and preventive regression testing.'
    },
    {
      id: 'beh-2',
      text: 'Describe a situation where you disagreed with a technical decision made by a teammate or tech lead. How did you handle the discussion?',
      category: 'behavioral',
      difficulty: 'mid',
      hint: 'Focus on constructive dialogue, data/benchmark evidence, compromise, and committing to the final team decision.',
      benchmarkAnswer: 'Discussed objectively using data and trade-off analysis, listened actively, and aligned with team commitments once a consensus was reached.'
    }
  ]
};

// Robust multi-stage JSON extractor for LLM responses
export function parseLLMJsonResponse<T>(rawText: string): T | null {
  if (!rawText) return null;

  try {
    // 1. Extract block from ```json ... ``` if present
    let candidate = rawText;
    const markdownMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
      candidate = markdownMatch[1];
    }

    // 2. Locate boundaries from first [ or { to last ] or }
    const firstBracket = candidate.indexOf('[');
    const firstBrace = candidate.indexOf('{');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIdx = firstBracket;
      endIdx = candidate.lastIndexOf(']');
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
      endIdx = candidate.lastIndexOf('}');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      candidate = candidate.substring(startIdx, endIdx + 1);
    }

    // 3. Remove trailing commas before closing braces/brackets
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');

    // 4. Primary Parse Attempt
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // 5. Secondary Sanitization Pass (repair unescaped line breaks inside string values)
      const sanitized = candidate
        .replace(/[\r\n]+/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/(:\s*"[^"]*)(")([^"]*")/g, '$1\\"$3');
      return JSON.parse(sanitized) as T;
    }
  } catch (err) {
    console.warn('LLM JSON parsing fallback triggered:', storageService.sanitizeError(err));
    return null;
  }
}

// Convert Blob to Base64 string for Gemini inlineData
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const aiService = {
  getEndpointUrl(): string {
    const { proxyUrl, model } = storageService.getApiConfig();
    if (proxyUrl) return proxyUrl;
    const modelName = model || 'gemini-2.5-flash';
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  },

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const { apiKey, proxyUrl } = storageService.getApiConfig();
    if (!apiKey && !proxyUrl) return '';

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const mimeType = audioBlob.type || 'audio/webm';

      const prompt = `Accurately transcribe the spoken candidate response in this audio recording into plain English text. 
Correct any technical software terms (e.g., PostgreSQL, Virtual DOM, React, WebSockets, TypeScript). 
Return ONLY the raw transcript text with no extra intro or wrap-up commentary.`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!proxyUrl && apiKey) {
        headers['x-goog-api-key'] = apiKey;
      }

      const response = await fetch(this.getEndpointUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Audio } }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (transcript) return transcript.trim();
      }
    } catch (e) {
      console.warn('Gemini Audio STT transcription error:', storageService.sanitizeError(e));
    }
    return '';
  },

  async generateQuestions(config: InterviewConfig): Promise<Question[]> {
    const { apiKey, proxyUrl } = storageService.getApiConfig();

    if (apiKey || proxyUrl) {
      try {
        const prompt = `Generate ${config.questionCount} interview questions for a candidate interviewing for a ${config.difficulty} ${config.roleTitle || config.category} position.
Category: ${config.category}
Difficulty: ${config.difficulty}
${config.customJobDescription ? `Job Description Context: ${config.customJobDescription}` : ''}

Respond ONLY with valid JSON matching this format:
[
  {
    "id": "q1",
    "text": "The question text",
    "category": "${config.category}",
    "difficulty": "${config.difficulty}",
    "hint": "Subtle hint for the candidate",
    "benchmarkAnswer": "Concise summary of what a strong answer includes"
  }
]`;

        const targetEndpoint = this.getEndpointUrl();

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (!proxyUrl && apiKey) {
          headers['x-goog-api-key'] = apiKey;
        }

        const response = await fetch(targetEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = parseLLMJsonResponse<Question[]>(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.slice(0, config.questionCount);
            }
          }
        } else {
          console.warn(`Gemini API returned status ${response.status}: ${response.statusText}`);
        }
      } catch (e) {
        console.warn('Gemini API call failed, falling back to curated question bank:', storageService.sanitizeError(e));
      }
    }

    // Fallback preset questions
    const categoryQuestions = PRESET_QUESTIONS[config.category] || PRESET_QUESTIONS.frontend;
    const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
    
    // Fill up if question count requested is higher than presets
    const result: Question[] = [];
    while (result.length < config.questionCount) {
      const q = shuffled[result.length % shuffled.length];
      result.push({ ...q, id: `gen-${result.length + 1}` });
    }
    return result;
  },

  async evaluateAnswer(
    question: Question,
    transcript: string,
    config: InterviewConfig,
    mediaBlob?: Blob
  ): Promise<QuestionEvaluation> {
    const { apiKey, proxyUrl } = storageService.getApiConfig();

    if ((apiKey || proxyUrl) && (transcript.trim().length > 5 || mediaBlob)) {
      try {
        const parts: any[] = [];
        
        let mediaNotice = '';
        if (mediaBlob) {
          try {
            const base64Media = await blobToBase64(mediaBlob);
            const mimeType = mediaBlob.type || 'video/webm';
            parts.push({ inlineData: { mimeType, data: base64Media } });
            mediaNotice = 'An attached raw audio/video clip of the candidate speaking is provided inline. Analyze the candidate\'s vocal delivery, spoken pace, tone, confidence, non-verbal presence, and technical correctness.';
          } catch (err) {
            console.warn('Failed to encode media blob for multimodal evaluation:', err);
          }
        }

        const prompt = `You are a Senior Tech Lead interviewing a candidate for a ${config.difficulty} ${config.roleTitle} role.
Question Asked: "${question.text}"
Benchmark Answer: "${question.benchmarkAnswer || ''}"
Candidate Spoken Response Transcript: "${transcript}"
${mediaNotice}

Evaluate the candidate's answer objectively.
Return ONLY valid JSON matching this exact structure:
{
  "questionId": "${question.id}",
  "score": 85,
  "technicalAccuracy": 85,
  "clarity": 90,
  "completeness": 80,
  "feedback": "Concise 2-sentence overall evaluation of their response.",
  "deliveryFeedback": "Evaluation of vocal tone, spoken pace, confidence, and communication delivery.",
  "whatWentWell": ["Point 1", "Point 2"],
  "areasToImprove": ["Area 1"],
  "benchmarkAnswer": "${question.benchmarkAnswer || 'Model answer summary'}"
}`;

        parts.unshift({ text: prompt });

        const targetEndpoint = this.getEndpointUrl();

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (!proxyUrl && apiKey) {
          headers['x-goog-api-key'] = apiKey;
        }

        const response = await fetch(targetEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = parseLLMJsonResponse<QuestionEvaluation>(rawText);
            if (parsed && typeof parsed.score === 'number') {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Gemini evaluation API error, using algorithmic evaluator:', storageService.sanitizeError(e));
      }
    }

    // Heuristic Algorithmic Evaluator for offline / demo mode
    const wordCount = transcript.trim().split(/\s+/).length;
    let baseScore = Math.min(95, Math.max(40, wordCount * 2 + 35));
    if (transcript.length < 10) baseScore = 30;

    return {
      questionId: question.id,
      score: Math.round(baseScore),
      technicalAccuracy: Math.round(baseScore * 0.95),
      clarity: Math.round(Math.min(100, baseScore + 5)),
      completeness: Math.round(Math.max(40, baseScore - 5)),
      feedback: wordCount > 20
        ? 'Solid response covering core terminology and concepts. Adding a concrete code example would make it even stronger.'
        : 'Brief response. Try structuring your answer with context, technical mechanism, and real-world trade-offs.',
      deliveryFeedback: wordCount > 20
        ? 'Good vocal pace and steady cadence throughout the explanation.'
        : 'Brief delivery. Practice speaking at a steady, confident pace with fuller explanations.',
      whatWentWell: [
        'Good baseline understanding of core concepts',
        'Clear delivery and structured thoughts'
      ],
      areasToImprove: [
        'Elaborate further on real-world edge cases and trade-offs',
        'Provide concrete code patterns or framework APIs'
      ],
      benchmarkAnswer: question.benchmarkAnswer || 'A comprehensive answer covers technical mechanisms, performance considerations, and real-world trade-offs.'
    };
  },

  /**
   * Dynamically generate session summary insights aggregated from individual question evaluations.
   */
  async generateSessionSummary(
    evaluations: Record<string, QuestionEvaluation>,
    config: InterviewConfig,
    overallScore: number
  ): Promise<{ strengths: string[]; improvements: string[]; overallVerdict: string }> {
    const allStrengths: string[] = [];
    const allImprovements: string[] = [];

    Object.values(evaluations).forEach((ev) => {
      if (Array.isArray(ev.whatWentWell)) {
        allStrengths.push(...ev.whatWentWell);
      }
      if (Array.isArray(ev.areasToImprove)) {
        allImprovements.push(...ev.areasToImprove);
      }
    });

    // Deduplicate lists
    const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 4);
    const uniqueImprovements = Array.from(new Set(allImprovements)).slice(0, 4);

    let overallVerdict = overallScore >= 80 
      ? `Strong Candidate - Ready for Technical On-Site (${config.difficulty.toUpperCase()})`
      : overallScore >= 60 
      ? `Competent Candidate - Solid Fundamentals with minor technical gaps`
      : `Developing Candidate - Needs focused revision on core ${config.category} concepts`;

    // Try generating high-level synthesized summary using Gemini API if key available
    const { apiKey, proxyUrl } = storageService.getApiConfig();
    if (apiKey || proxyUrl) {
      try {
        const prompt = `Synthesize a high-level session summary for a candidate interviewing for a ${config.difficulty} ${config.roleTitle} role.
Overall Score: ${overallScore}/100.
Question Evaluated Strengths: ${JSON.stringify(uniqueStrengths)}
Question Evaluated Areas to Improve: ${JSON.stringify(uniqueImprovements)}

Return ONLY valid JSON:
{
  "strengths": ["Key Synthesized Strength 1", "Key Synthesized Strength 2"],
  "improvements": ["Key Synthesized Improvement Area 1", "Key Synthesized Improvement Area 2"],
  "overallVerdict": "One-line executive summary verdict"
}`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (!proxyUrl && apiKey) {
          headers['x-goog-api-key'] = apiKey;
        }

        const response = await fetch(this.getEndpointUrl(), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = parseLLMJsonResponse<{ strengths: string[]; improvements: string[]; overallVerdict: string }>(rawText);
            if (parsed && Array.isArray(parsed.strengths) && Array.isArray(parsed.improvements)) {
              return {
                strengths: parsed.strengths.slice(0, 4),
                improvements: parsed.improvements.slice(0, 4),
                overallVerdict: parsed.overallVerdict || overallVerdict
              };
            }
          }
        }
      } catch (e) {
        console.warn('Session summary LLM synthesis fallback:', storageService.sanitizeError(e));
      }
    }

    return {
      strengths: uniqueStrengths.length > 0 ? uniqueStrengths : [
        'Demonstrated clear technical vocabulary and concept awareness',
        'Responded promptly under realistic video call conditions',
        'Good overall structure in explanation'
      ],
      improvements: uniqueImprovements.length > 0 ? uniqueImprovements : [
        'Incorporate concrete trade-off comparisons (e.g. Memory vs CPU)',
        'Mention framework-specific APIs and code design patterns'
      ],
      overallVerdict
    };
  }
};
