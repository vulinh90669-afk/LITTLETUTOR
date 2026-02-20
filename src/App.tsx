import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, School, User, Palette, Hash, Dog, 
  Utensils, Shirt, Home, Leaf, Smile, Zap, 
  Car, Briefcase, CloudSun, Clock, Star,
  BookOpen, Trophy, MessageCircle, ChevronRight, 
  Send, Sparkles, ArrowLeft, PlayCircle, CheckCircle2,
  Volume2, Mic, Square, Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { ROADMAP, Topic } from './constants';
import { GRAMMAR_LEVELS, GrammarLevel, GrammarStructure } from './grammarData';
import { chatWithTutor, generateLesson, textToSpeech, evaluatePronunciation } from './services/gemini';
import { pcmToWav } from './services/audioUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const iconMap: Record<string, any> = {
  Users, School, User, Palette, Hash, Dog, 
  Utensils, Shirt, Home, Leaf, Smile, Zap, 
  Car, Briefcase, CloudSun, Clock, Star
};

function LoginView({ users, onSelectUser, onCreateUser }: { users: any[], onSelectUser: (u: any) => void, onCreateUser: (name: string, grade: string) => void }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Lớp 2');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        <div className="space-y-8">
          <div className="inline-block p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 leading-tight">Chào mừng con đến với Teacher Joy!</h1>
          <p className="text-xl text-slate-500">Hãy chọn bạn nhỏ hoặc tạo hồ sơ mới để bắt đầu học nhé.</p>
          
          <div className="grid grid-cols-2 gap-4">
            {users.map((u) => (
              <button 
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-500 hover:shadow-md transition-all text-left group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{u.avatar}</div>
                <div className="font-bold text-slate-900">{u.name}</div>
                <div className="text-sm text-slate-400">{u.grade}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100 border border-slate-50 space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">Tạo hồ sơ mới</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tên của con</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Bảo Nam"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trình độ</label>
              <div className="grid grid-cols-2 gap-3">
                {['Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].map((g) => (
                  <button 
                    key={g}
                    onClick={() => setGrade(g)}
                    className={cn(
                      "p-4 rounded-2xl font-bold transition-all",
                      grade === g ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => name && onCreateUser(name, grade)}
              className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
            >
              Bắt đầu học ngay!
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: number, name: string, grade: string, avatar: string } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [view, setView] = useState<'dashboard' | 'roadmap' | 'lesson' | 'chat' | 'games' | 'grammar'>('dashboard');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, audio?: string }[]>([]);
  const [lessonData, setLessonData] = useState<any>(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<any[]>([]);
  const [learnedWords, setLearnedWords] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lessonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProgress();
      fetchWords();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    }
  };

  const handleCreateUser = async (name: string, grade: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade, avatar: ['😊', '🐶', '🐱', '🦁', '🐼', '🦄'][Math.floor(Math.random() * 6)] })
      });
      const user = await res.json();
      setCurrentUser(user);
      fetchUsers();
    } catch (err) {
      console.error("Create User Error:", err);
    }
  };

  const fetchWords = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/words/${currentUser.id}`);
      const data = await res.json();
      setLearnedWords(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProgress = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/progress/${currentUser.id}`);
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error(err);
    }
  };

  const startLesson = async (topic: Topic) => {
    if (!currentUser) return;
    setSelectedTopic(topic);
    setView('lesson');
    setIsLoading(true);
    setLessonData(null);
    setLessonStep(0);
    try {
      // Step 1: Fetch words from local DB (Optimizing tokens)
      const wordsRes = await fetch(`/api/words/topic/${encodeURIComponent(topic.name)}`);
      const localWords = await wordsRes.json();
      
      // Step 2: Use AI only for creative generation based on local words
      // Use user's grade to influence lesson difficulty
      const data = await generateLesson(topic.name, currentUser.grade, localWords);
      setLessonData(data);
    } catch (err) {
      alert("Ôi, có lỗi khi tải bài học. Con thử lại nhé!");
      setView('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      lessonRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const renderLesson = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Teacher Joy đang soạn bài học thú vị cho con...</p>
        </div>
      );
    }

    if (!lessonData) return null;

    const { words, fillInBlanks, dialogue } = lessonData;
    const totalSteps = words.length + 2; // Words + FillInBlanks + Dialogue

    const nextStep = () => {
      if (lessonStep < totalSteps - 1) {
        setLessonStep(lessonStep + 1);
      } else {
        // Finish lesson
        confetti({ particleCount: 200, spread: 100 });
        saveProgress(selectedTopic?.name || 'General', words.length);
        setView('dashboard');
      }
    };

    const saveProgress = async (topic: string, wordsCount: number) => {
      if (!currentUser) return;
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, topic, words_learned: wordsCount })
      });
      fetchProgress();
    };

    return (
      <div ref={lessonRef} className={cn(
        "bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden",
        isFullScreen ? "fixed inset-0 z-[100] rounded-none" : "h-[calc(100vh-12rem)]"
      )}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-50 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h3 className="font-bold text-slate-900">{lessonData.topic}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Bước {lessonStep + 1} / {totalSteps}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleFullScreen}
              className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              title="Toàn màn hình"
            >
              {isFullScreen ? <Square className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <AnimatePresence mode="wait">
            {lessonStep < words.length ? (
              <motion.div 
                key={`word-${lessonStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-indigo-100 rounded-3xl mb-4">
                    <Sparkles className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h2 className="text-6xl font-black text-slate-900 tracking-tight">{words[lessonStep].word}</h2>
                  <p className="text-2xl text-indigo-600 font-mono">{words[lessonStep].pronunciation}</p>
                  <p className="text-3xl font-bold text-slate-700">{words[lessonStep].meaning}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-slate-900">
                      <Volume2 className="w-5 h-5 text-indigo-500" /> Ví dụ
                    </h4>
                    <p className="text-lg italic text-slate-600">"{words[lessonStep].example}"</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleTTS(words[lessonStep].word)}
                        className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Volume2 className="w-5 h-5" /> Nghe từ
                      </button>
                      <button 
                        onClick={() => handleTTS(words[lessonStep].example)}
                        className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Volume2 className="w-5 h-5" /> Nghe câu
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        if (isRecording && recordingText === words[lessonStep].example) {
                          stopRecording();
                        } else {
                          startRecording(words[lessonStep].example, true);
                        }
                      }}
                      className={cn(
                        "w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                        isRecording && recordingText === words[lessonStep].example 
                          ? "bg-red-100 text-red-600 animate-pulse" 
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                      )}
                    >
                      {isRecording && recordingText === words[lessonStep].example ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      Luyện đọc cả câu
                    </button>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-amber-700">
                      <Star className="w-5 h-5 text-amber-500" /> Mẹo ghi nhớ
                    </h4>
                    <p className="text-amber-800 font-medium">{words[lessonStep].memoryTip}</p>
                    <button 
                      onClick={() => {
                        if (isRecording && recordingText === words[lessonStep].word) {
                          stopRecording();
                        } else {
                          startRecording(words[lessonStep].word);
                        }
                      }}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg",
                        isRecording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500 text-white hover:bg-emerald-600"
                      )}
                    >
                      {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      {isRecording ? "Đang ghi âm..." : "Con thử đọc nhé!"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : lessonStep === words.length ? (
              <motion.div 
                key="fill-in-blanks"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 mb-2">Thử thách điền từ</h2>
                  <p className="text-slate-500">Con hãy chọn từ đúng để hoàn thành các câu sau nhé!</p>
                </div>
                <div className="space-y-6">
                  {fillInBlanks.map((q: any, i: number) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                      <p className="text-2xl font-bold text-slate-800 text-center">{q.sentence}</p>
                      <div className="grid grid-cols-3 gap-4">
                        {q.options.map((opt: string, j: number) => (
                          <button 
                            key={j}
                            onClick={() => {
                              if (opt === q.answer) {
                                confetti({ particleCount: 50, spread: 60 });
                                alert("Chính xác! Con giỏi quá!");
                              } else {
                                alert("Chưa đúng rồi, con thử lại nhé!");
                              }
                            }}
                            className="py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="dialogue"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 mb-2">Hội thoại vui vẻ</h2>
                  <p className="text-slate-500">Luyện nghe và hiểu đoạn hội thoại ngắn này con nhé!</p>
                </div>
                <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl space-y-6">
                  <div className="flex justify-center mb-4">
                    <button 
                      onClick={() => handleTTS(dialogue.text)}
                      className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <Volume2 className="w-10 h-10" />
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none text-xl leading-relaxed italic text-center">
                    <Markdown>{dialogue.text}</Markdown>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <h4 className="text-xl font-bold text-slate-900 text-center">{dialogue.question}</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {dialogue.options.map((opt: string, i: number) => (
                      <button 
                        key={i}
                        onClick={() => {
                          if (opt === dialogue.answer) {
                            confetti({ particleCount: 100, spread: 70 });
                            alert("Đúng rồi! Con nghe giỏi thật đấy!");
                          } else {
                            alert("Con nghe lại một lần nữa xem sao nhé!");
                          }
                        }}
                        className="py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 text-left transition-all flex justify-between items-center group"
                      >
                        {opt}
                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={() => setLessonStep(Math.max(0, lessonStep - 1))}
            disabled={lessonStep === 0}
            className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold disabled:opacity-50 hover:bg-slate-200 transition-colors"
          >
            Quay lại
          </button>
          <button 
            onClick={nextStep}
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {lessonStep === totalSteps - 1 ? "Hoàn thành" : "Tiếp theo"} <ChevronRight className="w-5 h-5" />
          </button>
        </footer>
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      const response = await chatWithTutor(userMsg, history, { progress, roadmap: ROADMAP });
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      
      if (response.toLowerCase().includes('con làm tốt lắm') || response.toLowerCase().includes('chính xác')) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Thầy/Cô chưa nghe rõ, con nói lại được không?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async (text: string) => {
    try {
      const base64 = await textToSpeech(text);
      if (base64) {
        const audioUrl = pcmToWav(base64);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  const playFeedbackSound = (isCorrect: boolean) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (isCorrect) {
      // Success sound: Two rising beeps
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
      // Failure sound: One low falling beep
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.2); // A2
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    }
  };

  const startRecording = async (text: string, isSentence: boolean = false) => {
    try {
      // Visual/Audio cue for start
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Silence Detection Setup
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      const SILENCE_THRESHOLD = 15; // Sensitivity
      const SILENCE_DURATION = isSentence ? 2000 : 1200; // ms to wait before auto-stop
      const MAX_DURATION = isSentence ? 8000 : 4000; // ms max recording time
      const startTime = Date.now();

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average > SILENCE_THRESHOLD) {
          silenceStart = Date.now();
        }

        if (Date.now() - silenceStart > SILENCE_DURATION || Date.now() - startTime > MAX_DURATION) {
          stopRecording();
        } else {
          requestAnimationFrame(checkSilence);
        }
      };

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        source.disconnect();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsLoading(true);
          try {
            const result = await evaluatePronunciation(base64Audio, text, mimeType);
            const { accuracy, feedback, fluency, suggestion, isCorrect } = result;
            
            playFeedbackSound(isCorrect);
            
            setMessages(prev => [...prev, 
              { role: 'user', text: `[Âm thanh luyện đọc ${isSentence ? 'câu' : 'từ'}: ${text}]` },
              { 
                role: 'model', 
                text: `**Điểm: ${accuracy}%**\n\n${feedback}\n\n* **Trôi chảy:** ${fluency}\n* **Gợi ý:** ${suggestion}` 
              }
            ]);
            
            if (isCorrect) {
              confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 } });
            }
          } catch (err) {
            setMessages(prev => [...prev, { role: 'model', text: "Có lỗi khi đánh giá phát âm, con thử lại nhé!" }]);
          } finally {
            setIsLoading(false);
            setRecordingText(null);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingText(text);
      requestAnimationFrame(checkSilence);
    } catch (err) {
      console.error("Recording Error:", err);
      alert("Con cần cho phép sử dụng micro để luyện đọc nhé!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Chào {currentUser?.name} yêu! 👋</h1>
          <p className="text-slate-500 mt-2 font-medium">Hôm nay con muốn học gì ở trình độ {currentUser?.grade} nào?</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Trophy className="text-emerald-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm tích lũy</p>
            <p className="text-2xl font-bold text-slate-900">{progress.reduce((acc, p) => acc + p.words_learned, 0) * 10}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 cursor-pointer relative overflow-hidden group"
          onClick={() => setView('roadmap')}
        >
          <div className="relative z-10">
            <BookOpen className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Lộ trình học tập</h2>
            <p className="opacity-80">Khám phá 3000 từ vựng qua các chủ đề thú vị.</p>
            <div className="mt-6 flex items-center gap-2 font-bold">
              Xem ngay <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 cursor-pointer relative overflow-hidden group"
          onClick={() => setView('grammar')}
        >
          <div className="relative z-10">
            <BookOpen className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Cấu trúc câu</h2>
            <p className="opacity-80">Học các mẫu câu từ cơ bản đến nâng cao theo từng lớp.</p>
            <div className="mt-6 flex items-center gap-2 font-bold">
              Khám phá <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-emerald-500 p-8 rounded-3xl text-white shadow-xl shadow-emerald-200 cursor-pointer relative overflow-hidden group"
          onClick={() => setView('chat')}
        >
          <div className="relative z-10">
            <MessageCircle className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Trò chuyện với Teacher Joy</h2>
            <p className="opacity-80">Luyện nói và hỏi bất cứ điều gì con muốn.</p>
            <div className="mt-6 flex items-center gap-2 font-bold">
              Bắt đầu <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-amber-500 p-8 rounded-3xl text-white shadow-xl shadow-amber-200 cursor-pointer relative overflow-hidden group"
          onClick={() => setView('games')}
        >
          <div className="relative z-10">
            <Zap className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Trò chơi ôn tập</h2>
            <p className="opacity-80">Vừa chơi vừa học với 8 trò chơi cực vui.</p>
            <div className="mt-6 flex items-center gap-2 font-bold">
              Chơi ngay <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
        </motion.div>
      </div>

      <section>
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="text-amber-500 w-5 h-5" /> Bài học gợi ý
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {ROADMAP.slice(0, 6).map((topic) => {
            const Icon = iconMap[topic.icon];
            const isCompleted = progress.find(p => p.topic === topic.name)?.completed;
            return (
              <motion.div
                key={topic.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group relative"
                onClick={() => startLesson(topic)}
              >
                {isCompleted && (
                  <div className="absolute top-2 right-2 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div className="bg-slate-50 p-4 rounded-xl mb-4 group-hover:bg-indigo-50 transition-colors">
                  <Icon className="w-8 h-8 text-slate-600 group-hover:text-indigo-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm">{topic.name}</p>
                <p className="text-xs text-slate-400 mt-1">{topic.vietnamese}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderGrammar = () => {
    // Filter grammar levels based on user's grade
    const filteredLevels = currentUser ? GRAMMAR_LEVELS.filter(l => {
      const gradeNum = parseInt(currentUser.grade.replace(/\D/g, ''));
      const levelNum = parseInt(l.level.replace(/\D/g, ''));
      return levelNum <= gradeNum; // Show current and previous levels
    }) : GRAMMAR_LEVELS;

    return (
      <div className="space-y-8">
        <button 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>
        
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Cấu trúc tiếng Anh cho trẻ em</h1>
          <p className="text-slate-500">Học các mẫu câu quan trọng nhất chia theo từng cấp độ lớp học.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {filteredLevels.map((level, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
            >
              <div className={cn("p-6 text-white flex justify-between items-center", level.color)}>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest opacity-80">{level.level}</span>
                  <h3 className="text-2xl font-bold">{level.grade}</h3>
                </div>
                <BookOpen className="w-8 h-8 opacity-50" />
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {level.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">
                      {sIdx + 1}. {section.title}
                    </h4>
                    <div className="space-y-3">
                      {section.examples.map((ex, eIdx) => (
                        <div key={eIdx} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group hover:bg-indigo-50 transition-colors">
                          <span className="font-medium text-slate-700">{ex}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleTTS(ex)}
                              className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 hover:text-indigo-700"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => startRecording(ex, true)}
                              className="p-2 bg-white rounded-lg shadow-sm text-emerald-600 hover:text-emerald-700"
                            >
                              <Mic className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderRoadmap = () => (
    <div className="space-y-8">
      <button 
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>
      
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Lộ trình 3000 từ vựng</h1>
        <p className="text-slate-500">Được thiết kế riêng cho học sinh lớp 2-5 với các chủ đề từ cơ bản đến nâng cao.</p>
      </div>

      {[1, 2, 3].map(month => (
        <div key={month} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">Tháng {month}</div>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ROADMAP.filter(t => t.month === month).map(topic => {
              const Icon = iconMap[topic.icon];
              return (
                <div 
                  key={topic.id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-200 cursor-pointer group"
                  onClick={() => startLesson(topic)}
                >
                  <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-indigo-50">
                    <Icon className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{topic.name}</h4>
                    <p className="text-xs text-slate-400">{topic.vietnamese}</p>
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGames = () => {
    const gameList = [
      { id: 'flashcard', name: 'Thẻ ghi nhớ', icon: BookOpen, color: 'bg-blue-500' },
      { id: 'matching', name: 'Nối từ', icon: Zap, color: 'bg-purple-500' },
      { id: 'spelling', name: 'Đánh vần', icon: Mic, color: 'bg-emerald-500' },
      { id: 'multiple', name: 'Trắc nghiệm', icon: CheckCircle2, color: 'bg-orange-500' },
      { id: 'scramble', name: 'Sắp xếp chữ', icon: Hash, color: 'bg-pink-500' },
      { id: 'listen', name: 'Nghe & Chọn', icon: Volume2, color: 'bg-indigo-500' },
      { id: 'picture', name: 'Nhìn hình đoán từ', icon: Palette, color: 'bg-amber-500' },
      { id: 'truefalse', name: 'Đúng hay Sai', icon: Star, color: 'bg-red-500' },
    ];

    const initGame = (gameId: string) => {
      if (learnedWords.length < 4) {
        alert("Con cần học ít nhất 4 từ để bắt đầu chơi nhé!");
        return;
      }
      setCurrentGame(gameId);
      const shuffled = [...learnedWords].sort(() => 0.5 - Math.random());
      const currentWord = shuffled[0];
      
      if (gameId === 'multiple' || gameId === 'listen' || gameId === 'picture') {
        const options = [currentWord.meaning, ...shuffled.slice(1, 4).map(w => w.meaning)].sort(() => 0.5 - Math.random());
        setGameState({ word: currentWord, options, score: 0, round: 1 });
      } else if (gameId === 'scramble') {
        const scrambled = currentWord.word.split('').sort(() => 0.5 - Math.random()).join('');
        setGameState({ word: currentWord, scrambled, score: 0, round: 1 });
      } else {
        setGameState({ word: currentWord, score: 0, round: 1 });
      }
    };

    const handleAnswer = (answer: string) => {
      const isCorrect = answer.toLowerCase() === gameState.word.meaning.toLowerCase() || 
                        answer.toLowerCase() === gameState.word.word.toLowerCase();
      
      if (isCorrect) {
        confetti({ particleCount: 50, spread: 60 });
        const nextRound = gameState.round + 1;
        if (nextRound > 5) {
          alert(`Chúc mừng con! Con đã hoàn thành trò chơi với số điểm tuyệt đối!`);
          setCurrentGame(null);
          setGameState(null);
        } else {
          const shuffled = [...learnedWords].sort(() => 0.5 - Math.random());
          const nextWord = shuffled[0];
          const options = [nextWord.meaning, ...shuffled.slice(1, 4).map(w => w.meaning)].sort(() => 0.5 - Math.random());
          const scrambled = nextWord.word.split('').sort(() => 0.5 - Math.random()).join('');
          setGameState({ ...gameState, word: nextWord, options, scrambled, round: nextRound, score: gameState.score + 10 });
        }
      } else {
        alert("Chưa chính xác rồi, con thử lại nhé!");
      }
    };

    if (currentGame) {
      return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setCurrentGame(null)} className="text-slate-400 hover:text-slate-600"><ArrowLeft /></button>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vòng {gameState.round}/5</p>
              <h3 className="text-xl font-bold text-slate-900">{gameList.find(g => g.id === currentGame)?.name}</h3>
            </div>
            <div className="bg-amber-100 px-3 py-1 rounded-full text-amber-700 font-bold text-sm">
              {gameState.score} pts
            </div>
          </div>

          <div className="space-y-8 text-center">
            {currentGame === 'flashcard' && (
              <motion.div 
                whileTap={{ rotateY: 180 }}
                className="w-64 h-80 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold cursor-pointer shadow-xl"
                onClick={(e) => {
                  const target = e.currentTarget;
                  target.textContent = target.textContent === gameState.word.word ? gameState.word.meaning : gameState.word.word;
                }}
              >
                {gameState.word.word}
              </motion.div>
            )}

            {currentGame === 'multiple' && (
              <div className="space-y-6">
                <div className="text-5xl font-black text-indigo-600 mb-8">{gameState.word.word}</div>
                <div className="grid grid-cols-2 gap-4">
                  {gameState.options.map((opt: string, i: number) => (
                    <button 
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentGame === 'scramble' && (
              <div className="space-y-6">
                <div className="text-4xl font-mono tracking-widest text-indigo-600 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                  {gameState.scrambled.toUpperCase()}
                </div>
                <p className="text-slate-500 font-medium">Nghĩa là: <span className="text-slate-900 font-bold">{gameState.word.meaning}</span></p>
                <input 
                  type="text" 
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-center text-2xl font-bold focus:border-indigo-500 outline-none"
                  placeholder="Nhập từ đúng..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)}
                />
              </div>
            )}

            {currentGame === 'listen' && (
              <div className="space-y-6">
                <button 
                  onClick={() => handleTTS(gameState.word.word)}
                  className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto hover:bg-indigo-200 transition-all shadow-lg"
                >
                  <Volume2 className="w-10 h-10" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  {gameState.options.map((opt: string, i: number) => (
                    <button 
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentGame === 'picture' && (
              <div className="space-y-6">
                <img 
                  src={`https://picsum.photos/seed/${gameState.word.word}/400/300`} 
                  className="w-full h-48 object-cover rounded-2xl shadow-md border border-slate-100"
                  alt="Guess"
                  referrerPolicy="no-referrer"
                />
                <div className="grid grid-cols-2 gap-4">
                  {gameState.options.map((opt: string, i: number) => (
                    <button 
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8">
              <button 
                onClick={() => handleAnswer(gameState.word.word)}
                className="text-indigo-600 font-bold text-sm hover:underline"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600"><ArrowLeft /> Quay lại</button>
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Trò chơi ôn tập</h1>
          <p className="text-slate-500">Chọn một trò chơi để ôn lại những từ vựng con đã học nhé!</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {gameList.map(game => (
            <motion.div
              key={game.id}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer text-center group"
              onClick={() => initGame(game.id)}
            >
              <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg", game.color)}>
                <game.icon className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900">{game.name}</h4>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <header className="bg-white border-bottom border-slate-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-50 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Sparkles className="text-indigo-600 w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Teacher Joy</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Đang trực tuyến</span>
              </div>
            </div>
          </div>
        </div>
        {selectedTopic && (
          <div className="hidden sm:block bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chủ đề</p>
            <p className="text-sm font-bold text-slate-700">{selectedTopic.name}</p>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex w-full flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl shadow-sm",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
              )}>
                <div className="prose prose-sm max-w-none prose-slate">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
              
              {msg.role === 'model' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      // Extract English words from markdown if possible, or just play the whole text
                      // For simplicity, we'll let the user select or we try to find bold text
                      const boldMatches = msg.text.match(/\*\*(.*?)\*\*/g);
                      if (boldMatches) {
                        const word = boldMatches[0].replace(/\*\*/g, '');
                        handleTTS(word);
                      } else {
                        handleTTS(msg.text);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Nghe mẫu
                  </button>
                  
                  <button 
                    onClick={() => {
                      const boldMatches = msg.text.match(/\*\*(.*?)\*\*/g);
                      if (boldMatches) {
                        const word = boldMatches[0].replace(/\*\*/g, '');
                        if (isRecording && recordingText === word) {
                          stopRecording();
                        } else {
                          startRecording(word);
                        }
                      } else {
                        alert("Thầy/Cô chưa thấy từ vựng nào để luyện đọc. Con thử hỏi Teacher Joy nhé!");
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                      isRecording ? "bg-red-100 text-red-600 animate-pulse" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                  >
                    {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? "Đang ghi âm..." : "Luyện đọc"}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-start"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-100 rounded-tl-none flex gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <footer className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Nhập tin nhắn của con..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-700 font-medium"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </footer>
    </div>
  );

  if (!currentUser) {
    return (
      <LoginView 
        users={users} 
        onSelectUser={setCurrentUser} 
        onCreateUser={handleCreateUser} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">LITTLE<span className="text-indigo-600">TUTOR</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('dashboard')} className={cn("text-sm font-bold transition-colors", view === 'dashboard' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}>Trang chủ</button>
            <button onClick={() => setView('roadmap')} className={cn("text-sm font-bold transition-colors", view === 'roadmap' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}>Lộ trình</button>
            <button onClick={() => setView('grammar')} className={cn("text-sm font-bold transition-colors", view === 'grammar' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}>Cấu trúc câu</button>
            <button onClick={() => setView('games')} className={cn("text-sm font-bold transition-colors", view === 'games' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}>Trò chơi</button>
            <button onClick={() => setView('chat')} className={cn("text-sm font-bold transition-colors", view === 'chat' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600")}>Học tập</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-900">{currentUser.name}</div>
              <div className="text-xs text-slate-400 font-bold">{currentUser.grade}</div>
            </div>
            <button 
              onClick={() => setCurrentUser(null)}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              {currentUser.avatar}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dashboard' && renderDashboard()}
            {view === 'roadmap' && renderRoadmap()}
            {view === 'grammar' && renderGrammar()}
            {view === 'games' && renderGames()}
            {view === 'lesson' && renderLesson()}
            {view === 'chat' && renderChat()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
