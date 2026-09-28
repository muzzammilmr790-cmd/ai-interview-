import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Bot, 
  Volume2, 
  VolumeX, 
  Clock, 
  Lightbulb, 
  ArrowRight, 
  SkipForward, 
  Edit3, 
  Sparkles,
  AlertCircle,
  Square
} from 'lucide-react';
import type { Question, CandidateAnswer, CameraState } from '../types/interview';
import { speechService } from '../services/speechService';
import { mediaStorageService } from '../services/mediaStorageService';
import { aiService } from '../services/aiService';
import { Modal } from './Modal';

interface InterviewRoomProps {
  sessionId?: string;
  questions: Question[];
  timePerQuestion: number;
  onFinishInterview: (answers: Record<string, CandidateAnswer>) => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  sessionId,
  questions,
  timePerQuestion,
  onFinishInterview,
}) => {
  const [currentSessionId] = useState(() => sessionId || `session-${Date.now()}`);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CandidateAnswer>>({});
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isTranscribingWithAi, setIsTranscribingWithAi] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [showEndModal, setShowEndModal] = useState(false);

  // Camera & Mic State
  const [cameraState, setCameraState] = useState<CameraState>({
    hasCameraPermission: false,
    hasMicPermission: false,
    isCameraOn: true,
    isMicOn: true,
  });

  // Speaking / Listening Status
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCandidateRecording, setIsCandidateRecording] = useState(false);
  const [isMediaRecording, setIsMediaRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const currentQuestion = questions[currentIndex];

  // Helper to start MediaRecorder for video/audio blob recording
  const startMediaRecording = () => {
    if (!mediaStreamRef.current || typeof window.MediaRecorder === 'undefined') return;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setIsMediaRecording(true);
    } catch (err) {
      console.warn('MediaRecorder recording could not start:', err);
    }
  };

  // Helper to stop MediaRecorder and return blob & URL
  const stopMediaRecording = (): Promise<{ url?: string; type?: string; blob?: Blob }> => {
    return new Promise((resolve) => {
      setIsMediaRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            recordedChunksRef.current = [];
            resolve({ url, type: mimeType, blob });
          } else {
            resolve({});
          }
        };
        try {
          mediaRecorderRef.current.stop();
        } catch {
          resolve({});
        }
      } else {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          recordedChunksRef.current = [];
          resolve({ url, type: 'video/webm', blob });
        } else {
          resolve({});
        }
      }
    });
  };

  // Initialize Webcam Stream
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraState((prev) => ({
          ...prev,
          hasCameraPermission: true,
          hasMicPermission: true,
          isCameraOn: true,
          isMicOn: true,
          error: undefined,
        }));
      } catch (err: any) {
        console.warn('Webcam permission error:', err);
        setCameraState((prev) => ({
          ...prev,
          error: 'Webcam/Mic access denied or unavailable. You can still type your responses directly.',
        }));
      }
    }

    startCamera();

    return () => {
      // Clean up stream tracks when unmounting
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Question Changes & Auto-speak AI Question & Start Recording
  useEffect(() => {
    if (!currentQuestion) return;

    setCurrentTranscript('');
    setShowHint(false);
    setTimeLeft(timePerQuestion);
    setQuestionStartTime(Date.now());

    // Stop candidate recording & stop prior AI speech
    speechService.stopListening();
    speechService.stopSpeaking();
    setIsCandidateRecording(false);

    // Start video/audio MediaRecorder recording
    startMediaRecording();

    // Check speech recognition support
    if (!speechService.isRecognitionSupported()) {
      setIsEditingTranscript(true);
    }

    // Speak AI Question automatically
    setIsAiSpeaking(true);
    speechService.speak(
      currentQuestion.text,
      () => setIsAiSpeaking(true),
      () => {
        setIsAiSpeaking(false);
        // Start candidate listening after AI finishes speaking
        autoStartCandidateRecording();
      }
    );
  }, [currentIndex]);

  // Timer countdown hook
  useEffect(() => {
    if (timePerQuestion <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, timePerQuestion]);

  const autoStartCandidateRecording = () => {
    if (!cameraState.isMicOn) return;

    const success = speechService.startListening(
      (text) => {
        setCurrentTranscript(text);
      },
      (err) => console.warn(err)
    );

    if (success) {
      setIsCandidateRecording(true);
    } else if (!speechService.isRecognitionSupported()) {
      setIsEditingTranscript(true);
    }
  };

  const toggleMic = () => {
    const nextState = !cameraState.isMicOn;
    setCameraState((prev) => ({ ...prev, isMicOn: nextState }));

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }

    if (nextState) {
      autoStartCandidateRecording();
    } else {
      speechService.stopListening();
      setIsCandidateRecording(false);
    }
  };

  const toggleCamera = () => {
    const nextState = !cameraState.isCameraOn;
    setCameraState((prev) => ({ ...prev, isCameraOn: nextState }));

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  const toggleAiSpeech = () => {
    if (isAiSpeaking) {
      speechService.stopSpeaking();
      setIsAiSpeaking(false);
    } else {
      setIsAiSpeaking(true);
      speechService.speak(
        currentQuestion.text,
        () => setIsAiSpeaking(true),
        () => setIsAiSpeaking(false)
      );
    }
  };

  const handleTranscribeAudioWithAi = async () => {
    if (recordedChunksRef.current.length === 0) return;
    try {
      setIsTranscribingWithAi(true);
      const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
      const tempBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      const text = await aiService.transcribeAudio(tempBlob);
      if (text) {
        setCurrentTranscript(text);
      }
    } catch (e) {
      console.warn('Manual AI STT transcription error:', e);
    } finally {
      setIsTranscribingWithAi(false);
    }
  };

  const saveCurrentAnswer = async () => {
    const duration = Math.round((Date.now() - questionStartTime) / 1000);
    const media = await stopMediaRecording();

    let recordingUrl = media.url;
    let finalTranscript = currentTranscript.trim();

    if (media.blob) {
      // 1. Save media Blob into IndexedDB for persistent video playback across tab reloads
      const idbKey = await mediaStorageService.saveRecording(currentSessionId, currentQuestion.id, media.blob);
      recordingUrl = media.url || idbKey;

      // 2. Perform AI Multimodal Audio STT if browser SpeechRecognition was unsupported or transcript is empty
      if (!finalTranscript || finalTranscript === '[No response provided]' || !speechService.isRecognitionSupported()) {
        try {
          setIsTranscribingWithAi(true);
          const aiTranscript = await aiService.transcribeAudio(media.blob);
          if (aiTranscript) {
            finalTranscript = aiTranscript;
            setCurrentTranscript(aiTranscript);
          }
        } catch (err) {
          console.warn('AI STT transcription during save error:', err);
        } finally {
          setIsTranscribingWithAi(false);
        }
      }
    }

    return {
      ...answers,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        transcript: finalTranscript || '[No response provided]',
        durationSeconds: duration,
        submittedAt: new Date().toISOString(),
        recordingUrl,
        mediaType: media.type,
        mediaBlob: media.blob,
      },
    };
  };

  const handleNextQuestion = async () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    setIsCandidateRecording(false);

    const updatedAnswers = await saveCurrentAnswer();
    setAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinishInterview(updatedAnswers);
    }
  };

  const handleConfirmEndEarly = async () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    setIsCandidateRecording(false);
    setShowEndModal(false);

    const updatedAnswers = await saveCurrentAnswer();
    onFinishInterview(updatedAnswers);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      
      {/* Camera Error Alert Banner */}
      {cameraState.error && (
        <div className="bento-panel p-4 rounded-2xl border-l-4 border-amber-400 bg-amber-500/10 flex items-center justify-between text-amber-200 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{cameraState.error}</span>
          </div>
          <button
            onClick={() => setCameraState((prev) => ({ ...prev, error: undefined }))}
            className="text-amber-400 hover:text-white font-bold text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Timer */}
      <div className="flex items-center justify-between bento-panel p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="pulse-indicator" />
          <span className="text-white font-bold text-sm">Live Interview Session</span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-emerald-400 font-mono border border-slate-800">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {timePerQuestion > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm font-bold">
              <Clock className={`w-4 h-4 ${timeLeft < 20 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
              <span className={timeLeft < 20 ? 'text-red-400' : 'text-white'}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowEndModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            End Early
          </button>
        </div>
      </div>

      {/* Main Video Call Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT WINDOW: AI Interrogator Card */}
        <div className="bento-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[420px] border border-emerald-500/20 shadow-2xl">
          
          {/* AI Header & Speaking Indicator */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Bot className="w-7 h-7 text-slate-950 font-bold" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    AI Lead Interrogator
                    {isAiSpeaking && (
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono font-semibold">
                        <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" /> Speaking...
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Evaluating Technical Depth &amp; Communication</p>
                </div>
              </div>

              <button
                onClick={toggleAiSpeech}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                title={isAiSpeaking ? 'Mute AI Voice' : 'Replay Question Audio'}
              >
                {isAiSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Audio Waveform Animation when AI speaks */}
            {isAiSpeaking && (
              <div className="flex items-center justify-center gap-1.5 py-3 mb-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
              </div>
            )}

            {/* Question Text Display */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-mono font-bold block mb-2">
                Question Prompt
              </span>
              <p className="text-white font-semibold text-lg leading-relaxed">
                {currentQuestion?.text}
              </p>
            </div>
          </div>

          {/* Hint Area */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            {showHint ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-200 font-semibold mb-0.5">Interviewer Hint:</strong>
                  {currentQuestion?.hint || 'Structure your response clearly with context, implementation, and trade-offs.'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Need a hint for this question?
              </button>
            )}
          </div>
        </div>

        {/* RIGHT WINDOW: Candidate Live Webcam Stream */}
        <div className="bento-panel p-6 rounded-3xl relative flex flex-col justify-between min-h-[420px] border border-slate-800 shadow-2xl">
          
          {/* Candidate Webcam Container */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
            
            {cameraState.isCameraOn && cameraState.hasCameraPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <CameraOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Camera Feed Offline</p>
              </div>
            )}

            {/* Candidate Label Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Candidate Live Feed
            </div>

            {/* Live Video/Audio Recording Status Badge */}
            {isMediaRecording && (
              <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-400 text-[11px] font-mono font-bold text-white flex items-center gap-1.5 shadow-lg animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                REC ACTIVE
              </div>
            )}

            {/* Camera & Mic Action Controls Overlay */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
              <button
                onClick={toggleMic}
                className={`p-2.5 rounded-lg transition-colors ${
                  cameraState.isMicOn ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
                title={cameraState.isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {cameraState.isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-2.5 rounded-lg transition-colors ${
                  cameraState.isCameraOn ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
                title={cameraState.isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {cameraState.isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real-time Candidate Speech Transcript Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex-1 flex flex-col justify-between">
            <div>
              {!speechService.isRecognitionSupported() && (
                <div className="mb-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] leading-relaxed flex items-center justify-between">
                  <span>Firefox/Safari detected: Automatic AI Audio Transcription is active for recorded audio.</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Your Spoken Response:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTranscribeAudioWithAi}
                    disabled={isTranscribingWithAi}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                    title="Transcribe recorded audio using Gemini AI Speech-to-Text"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {isTranscribingWithAi ? 'Transcribing Audio...' : 'Transcribe Audio with AI'}
                  </button>
                  <button
                    onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Edit3 className="w-3 h-3" />
                    {isEditingTranscript ? 'Done Editing' : 'Edit Response'}
                  </button>
                </div>
              </div>

              {isEditingTranscript ? (
                <textarea
                  value={currentTranscript}
                  onChange={(e) => setCurrentTranscript(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <p className="text-xs text-slate-200 min-h-[48px] leading-relaxed italic">
                  {currentTranscript || (
                    <span className="text-slate-500 not-italic">
                      {isCandidateRecording 
                        ? 'Listening... Speak your answer now.' 
                        : isTranscribingWithAi 
                        ? 'Transcribing audio via AI...' 
                        : 'Microphone muted or awaiting recording. Click Unmute or type your response.'}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="bento-panel p-4 rounded-2xl flex items-center justify-between">
        
        {/* Progress Indicators */}
        <div className="flex items-center gap-2">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-emerald-400 ring-4 ring-emerald-400/20 scale-110'
                  : idx < currentIndex
                  ? 'bg-cyan-400'
                  : 'bg-slate-800'
              }`}
              title={`Question ${idx + 1}`}
            />
          ))}
        </div>

        {/* Submit / Skip Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip Question
          </button>

          <button
            onClick={handleNextQuestion}
            className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {currentIndex === questions.length - 1 ? 'Finish Interview' : 'Submit & Next Question'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Modal Dialog: Confirm End Interview Early */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title={
          <span className="flex items-center gap-2 text-white">
            <Square className="w-4 h-4 text-red-400 fill-current" />
            End Interview Session Early?
          </span>
        }
      >
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Are you sure you want to end this interview session right now? Your current answers up to Question {currentIndex + 1} will be submitted and evaluated by the AI interviewer.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowEndModal(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Continue Interview
          </button>
          <button
            onClick={handleConfirmEndEarly}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
          >
            End &amp; View Evaluation
          </button>
        </div>
      </Modal>

    </div>
  );
};

