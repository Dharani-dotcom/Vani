/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  BookOpen, 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'devotee';
  createdAt: any;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  bookTitle: string;
  durationMinutes: number;
  totalQuestions: number;
  creatorId: string;
  createdAt: any;
}

interface Question {
  id: string;
  type: 'mcq' | 'descriptive';
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  idealAnswer?: string;
  explanation: string;
  order: number;
}

interface Submission {
  id: string;
  userId: string;
  examId: string;
  examTitle: string;
  score: number;
  total: number;
  answers: (number | string)[];
  results?: { correct: boolean; score: number }[];
  completedAt: any;
}

// --- Components ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'dashboard' | 'exam' | 'admin' | 'results'>('home');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', u.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data() as UserProfile;
            // Auto-promote to admin if email matches
            if (u.email === 'bharathidharani52@gmail.com' && data.role !== 'admin') {
              const updated = { ...data, role: 'admin' as const };
              await setDoc(doc(db, 'users', u.uid), updated);
              setProfile(updated);
            } else {
              setProfile(data);
            }
            setView('dashboard');
          } else {
            // Create profile for new user
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || 'Devotee',
              role: u.email === 'bharathidharani52@gmail.com' ? 'admin' : 'devotee',
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setProfile(newProfile);
            setView('dashboard');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
        setView('home');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#2D2D2D] font-sans selection:bg-[#FFCC66] selection:text-[#2D2D2D]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#FF9933]/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView(profile ? 'dashboard' : 'home')}
          >
            <div className="w-10 h-10 bg-[#FF9933] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#FF9933]/20">
              <BookOpen size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Prabhupada Vani Quiz</span>
          </div>

          <div className="flex items-center gap-4">
            {profile ? (
              <>
                {(profile.role === 'admin' || profile.email === 'bharathidharani52@gmail.com') && (
                  <button 
                    onClick={() => setView('admin')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'admin' ? 'bg-[#FF9933] text-white' : 'hover:bg-[#FF9933]/10 text-[#FF9933]'}`}
                  >
                    <PlusCircle size={20} />
                    <span className="hidden md:inline font-medium">Manage Exams</span>
                  </button>
                )}
                <button 
                  onClick={() => setView('results')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'results' ? 'bg-[#FF9933] text-white' : 'hover:bg-[#FF9933]/10 text-[#FF9933]'}`}
                >
                  <Award size={20} />
                  <span className="hidden md:inline font-medium">My Results</span>
                </button>
                <div className="h-8 w-px bg-gray-200 mx-2" />
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors bg-white font-medium shadow-sm border border-red-50"
                >
                  <LogOut size={20} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button 
                onClick={login}
                className="bg-[#FF9933] text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-[#FF9933]/30 hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeView onLogin={login} />
            </motion.div>
          )}
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DashboardView onSelectExam={(id) => { setSelectedExamId(id); setView('exam'); }} />
            </motion.div>
          )}
          {view === 'exam' && selectedExamId && (
            <motion.div key={`exam-${selectedExamId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExamRunner 
                examId={selectedExamId} 
                userId={profile?.uid || ''} 
                onComplete={() => setView('results')}
                onCancel={() => setView('dashboard')}
              />
            </motion.div>
          )}
          {view === 'admin' && profile?.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel />
            </motion.div>
          )}
          {view === 'results' && profile && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView userId={profile.uid} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Views ---

function HomeView({ onLogin }: { onLogin: () => void }) {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('asia-southeast1.run.app');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center max-w-3xl mx-auto py-12"
    >
      <div className="mb-8 p-4 bg-[#FF9933]/5 rounded-full">
         <BookOpen size={64} className="text-[#FF9933]" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
        Deepen Your Knowledge of <br />
        <span className="text-[#FF9933]">Srila Prabhupada's Books</span>
      </h1>
      <p className="text-xl text-gray-600 mb-10 leading-relaxed">
        Test your realization and understanding of the transcendental knowledge presented in HDG A.C. Bhaktivedanta Swami Prabhupada's books through structured exams.
      </p>

      {!showAuthForm ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setShowAuthForm(true)}
            className="bg-[#FF9933] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#FF9933]/30 hover:scale-[1.02] transition-transform flex items-center gap-2"
          >
            Get Started <ChevronRight size={20} />
          </button>
          <button 
            onClick={onLogin}
            className="bg-white text-[#2D2D2D] border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            Google Sign In
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100 mt-4"
        >
          <h2 className="text-2xl font-bold mb-6">{isRegister ? 'Create Account' : 'Sign In'}</h2>
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" 
                  placeholder="Your Name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" 
                placeholder="devotee@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" 
                placeholder="••••••••"
              />
            </div>
            {authError && <p className="text-xs text-red-500 font-medium">{authError}</p>}
            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full py-4 bg-[#FF9933] text-white rounded-xl font-bold shadow-lg shadow-[#FF9933]/20 flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? 'Register' : 'Sign In')}
            </button>
            <div className="flex flex-col gap-2 pt-4">
              <button 
                type="button" 
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm font-medium text-[#FF9933] hover:underline"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
              <button 
                type="button" 
                onClick={onLogin}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Or continue with Google
              </button>
              <button 
                type="button" 
                onClick={() => setShowAuthForm(false)}
                className="text-sm font-medium text-gray-400"
              >
                Back
              </button>
              {isDev && (
                <button 
                  type="button"
                  onClick={() => { setEmail('bharathidharani52@gmail.com'); setPassword('devotee123'); setIsRegister(false); }}
                  className="text-[10px] text-gray-300 mt-4 hover:text-gray-400"
                >
                  Dev Hint: use admin creds
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}

      <p className="mt-8 text-sm text-gray-400">First-time users will be automatically registered as devotees.</p>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { title: 'Structured Exams', desc: 'Carefully curated questions focused on key philosophical points.', icon: LayoutDashboard },
          { title: 'Instant Results', desc: 'Get immediate feedback on your performance and clear explanations.', icon: Award },
          { title: 'Progress Tracking', desc: 'Keep a record of your exams and monitor your spiritual growth.', icon: Clock },
        ].map((feat, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <feat.icon className="text-[#FF9933] mb-4" size={32} />
            <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
            <p className="text-gray-500">{feat.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DashboardView({ onSelectExam }: { onSelectExam: (id: string) => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(collection(db, 'exams'));
        const querySnapshot = await getDocs(q);
        const examList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
        setExams(examList);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'exams');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#FF9933]" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Available Exams</h2>
          <p className="text-gray-500">Select an exam to begin your study session.</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-400">No exams available yet.</h3>
          <p className="text-gray-400">Please check back later or contact an administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <motion.div 
              key={exam.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-[#FF9933]/10 text-[#FF9933] text-xs font-bold rounded-full uppercase tracking-wider">
                  {exam.bookTitle}
                </span>
                <div className="flex items-center text-gray-400 text-xs gap-1">
                  <Clock size={14} />
                  {exam.durationMinutes} min
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-[#FF9933] transition-colors">{exam.title}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2">{exam.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <LayoutDashboard size={16} />
                  {exam.totalQuestions} Questions
                </div>
                <button 
                  onClick={() => onSelectExam(exam.id)}
                  className="bg-[#2D2D2D] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#FF9933] transition-colors"
                >
                  Start Exam <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ExamRunner({ examId, userId, onComplete, onCancel }: { 
  examId: string, 
  userId: string, 
  onComplete: () => void,
  onCancel: () => void
}) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() } as Exam);
          const qSnap = await getDocs(query(collection(db, `exams/${examId}/questions`)));
          const qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)).sort((a, b) => a.order - b.order);
          setQuestions(qList);
          setAnswers(new Array(qList.length).fill(-1));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `exams/${examId}`);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [examId]);

  const handleAnswer = (val: number | string) => {
    if (showExplanation) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = val;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    setIsGrading(true);
    try {
      const gradingPromises = questions.map(async (q, i) => {
        const ans = answers[i];
        if (q.type === 'mcq') {
          const isCorrect = ans === q.correctOptionIndex;
          return { score: isCorrect ? 1 : 0, correct: isCorrect };
        } else {
          try {
            const s = await gradeDescriptiveAnswer(q.questionText, q.idealAnswer || '', ans as string);
            return { score: s, correct: s >= 0.7 };
          } catch (e) {
            console.error("AI Grading failed", e);
            return { score: 0, correct: false };
          }
        }
      });

      const gradedResults = await Promise.all(gradingPromises);
      const totalScore = gradedResults.reduce((acc, curr) => acc + curr.score, 0);
      
      const submission: Omit<Submission, 'id'> = {
        userId,
        examId,
        examTitle: exam?.title || 'Unknown Exam',
        score: Math.round(totalScore * 10) / 10,
        total: questions.length,
        answers,
        results: gradedResults.map(r => ({ correct: r.correct, score: r.score })),
        completedAt: serverTimestamp(),
      };

      await setDoc(doc(collection(db, 'submissions')), submission);
      setIsGrading(false);
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'submissions');
      setIsGrading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  async function gradeDescriptiveAnswer(question: string, ideal: string, devoteeAnswer: string): Promise<number> {
    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, ideal, answer: devoteeAnswer }),
      });
      const data = await response.json();
      return data.score || 0;
    } catch (error) {
      console.error("API Grading failed", error);
      return 0;
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#FF9933]" /></div>;
  if (!exam || questions.length === 0) return <div>Exam not found or has no questions.</div>;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#2D2D2D] p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold truncate max-w-[200px] sm:max-w-md">{exam.title}</h2>
              <p className="text-gray-400 text-sm">Question {currentIndex + 1} of {questions.length}</p>
            </div>
            <button 
              onClick={() => { if(confirm('Exit exam? Progress will be lost.')) onCancel(); }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#FF9933]" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8 leading-tight">{currentQuestion.questionText}</h3>
          
          <div className="space-y-4 mb-10">
            {currentQuestion.type === 'mcq' && currentQuestion.options ? (
              currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showExplanation}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group
                    ${answers[currentIndex] === idx 
                      ? 'border-[#FF9933] bg-[#FF9933]/5 text-[#FF9933]' 
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors
                      ${answers[currentIndex] === idx ? 'bg-[#FF9933] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium">{option}</span>
                  </div>
                  {answers[currentIndex] === idx && <CheckCircle2 size={24} />}
                </button>
              ))
            ) : (
              <textarea
                value={answers[currentIndex] === -1 ? '' : answers[currentIndex] as string}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here based on Srila Prabhupada's teachings..."
                className="w-full p-6 rounded-2xl border-2 border-gray-100 focus:border-[#FF9933] focus:ring-0 outline-none min-h-[200px] text-lg leading-relaxed transition-all"
              />
            )}
          </div>

          <AnimatePresence>
            {showExplanation && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
                  <AlertCircle size={20} />
                  Explanation
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            {!showExplanation && answers[currentIndex] !== -1 && !isGrading && (
              <button 
                onClick={() => setShowExplanation(true)}
                className="flex-1 py-4 px-6 border-2 border-blue-200 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-colors"
              >
                Explain Answer
              </button>
            )}
            <button 
              onClick={nextQuestion}
              disabled={answers[currentIndex] === -1 || isSubmitting}
              className="flex-[2] bg-[#FF9933] text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-[#FF9933]/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={24} />
                  <span>{isGrading ? 'AI Grading...' : 'Submitting...'}</span>
                </div>
              ) : (
                <>
                  {currentIndex === questions.length - 1 ? 'Finish Exam' : 'Next Question'} 
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResultsView({ userId }: { userId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDetailId, setViewingDetailId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(collection(db, 'submissions'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
        setSubmissions(list.sort((a,b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#FF9933]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-3xl font-bold mb-8">Exam History</h2>
      {submissions.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-3xl border border-gray-100">
          <Award size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-medium text-gray-400">No exams completed yet.</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((s) => {
            const percentage = Math.round((s.score / s.total) * 100);
            const isExpanded = viewingDetailId === s.id;

            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setViewingDetailId(isExpanded ? null : s.id)}
                >
                  <div>
                    <h3 className="text-xl font-bold mb-1">{s.examTitle}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {s.completedAt?.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <LayoutDashboard size={16} />
                        {s.total} Questions
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FF9933]">{s.score}/{s.total}</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Score</div>
                    </div>
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-lg
                      ${percentage >= 80 ? 'border-green-500 text-green-600' : percentage >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && s.results && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-gray-50 bg-[#FFFDF7]/30 p-6 overflow-hidden"
                    >
                      <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-4">Detailed Breakdown</h4>
                      <div className="grid gap-3">
                        {s.results.map((res, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                            <span className="text-sm font-medium">Question {idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400">Score: {res.score}</span>
                              {res.correct ? (
                                <CheckCircle2 className="text-green-500" size={18} />
                              ) : (
                                <XCircle className="text-red-400" size={18} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-2">Answers Provided</h4>
                        <div className="space-y-2">
                           {s.answers.map((ans, idx) => (
                             <div key={idx} className="text-sm p-2 bg-gray-50 rounded-lg text-gray-600 truncate">
                               Q{idx+1}: {typeof ans === 'number' ? `Option ${String.fromCharCode(65 + ans)}` : ans}
                             </div>
                           ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function AdminPanel() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions'>('exams');
  const [showAddExam, setShowAddExam] = useState(false);
  
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '', description: '', bookTitle: '', durationMinutes: 30
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const examSnap = await getDocs(query(collection(db, 'exams')));
      setExams(examSnap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
      
      const subSnap = await getDocs(query(collection(db, 'submissions')));
      setAllSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)).sort((a,b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)));

      const userSnap = await getDocs(query(collection(db, 'users')));
      setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() } as any as UserProfile)));
    } catch (err) { handleFirestoreError(err, OperationType.GET, 'admin-data'); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const examData = {
        ...newExam,
        creatorId: auth.currentUser?.uid,
        totalQuestions: 0,
        createdAt: serverTimestamp(),
      };
      const examRef = doc(collection(db, 'exams'));
      await setDoc(examRef, examData);
      setShowAddExam(false);
      setNewExam({ title: '', description: '', bookTitle: '', durationMinutes: 30 });
      loadData();
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'exams'); }
  };

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button 
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'exams' ? 'bg-white shadow-sm text-[#FF9933]' : 'text-gray-500'}`}
          >
            Manage Exams
          </button>
          <button 
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'submissions' ? 'bg-white shadow-sm text-[#FF9933]' : 'text-gray-500'}`}
          >
            Gradebook
          </button>
        </div>
      </div>

      {activeTab === 'exams' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-sm">Exam List</h3>
            <button 
              onClick={() => setShowAddExam(true)}
              className="bg-[#2D2D2D] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              <PlusCircle size={20} /> Create New Exam
            </button>
          </div>

          {showAddExam && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Create New Exam</h3>
                <form onSubmit={handleCreateExam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Exam Title</label>
                    <input required value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" placeholder="e.g. Bhagavad Gita Ch 1 Quiz" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Book Title</label>
                    <input required value={newExam.bookTitle} onChange={e => setNewExam({...newExam, bookTitle: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" placeholder="e.g. Bhagavad Gita As It Is" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" rows={3} placeholder="Brief summary of the exam goals..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                    <input type="number" required value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddExam(false)} className="flex-1 py-3 px-6 border-2 border-gray-100 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-3 px-6 bg-[#FF9933] text-white rounded-xl font-bold shadow-lg shadow-[#FF9933]/20">Create Exam</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          <div className="grid gap-4">
            {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#FF9933]" /></div> : (
              exams.map((exam) => (
                <div key={exam.id}>
                  <AdminExamItem exam={exam} onRefresh={loadData} />
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-400 font-bold uppercase tracking-widest text-sm">Devotee Progress</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Devotee</th>
                  <th className="px-6 py-4">Exam</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSubmissions.map((s) => {
                  const student = users.find(u => u.uid === s.userId);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{student?.displayName || 'Unknown'}</div>
                        <div className="text-[10px] text-gray-400">{student?.email}</div>
                      </td>
                      <td className="px-6 py-4">{s.examTitle}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold ${s.score/s.total >= 0.8 ? 'text-green-600' : 'text-[#FF9933]'}`}>
                          {s.score}/{s.total}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {s.completedAt?.toDate().toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {allSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No submissions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminExamItem({ exam, onRefresh }: { exam: Exam, onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddQ, setShowAddQ] = useState(false);
  const [newQ, setNewQ] = useState<Partial<Question>>({
    type: 'mcq', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '', idealAnswer: ''
  });

  const loadQuestions = async () => {
    const qSnap = await getDocs(query(collection(db, `exams/${exam.id}/questions`)));
    setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)).sort((a,b) => a.order - b.order));
  };

  useEffect(() => { if (expanded) loadQuestions(); }, [expanded]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const qRef = doc(collection(db, `exams/${exam.id}/questions`));
      await setDoc(qRef, { ...newQ, order: questions.length });
      // Update exam total questions count
      await setDoc(doc(db, 'exams', exam.id), { totalQuestions: questions.length + 1 }, { merge: true });
      setShowAddQ(false);
      setNewQ({ type: 'mcq', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '', idealAnswer: '' });
      loadQuestions();
      onRefresh();
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'questions'); }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold">{exam.title}</h4>
          <p className="text-sm text-gray-500">{exam.bookTitle} • {exam.totalQuestions} Questions</p>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-3 hover:bg-gray-50 rounded-2xl transition-all"
        >
          {expanded ? <CheckCircle2 className="text-[#FF9933]" /> : <ChevronRight />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-gray-50 bg-[#FFFDF7]/50 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h5 className="font-bold text-[#FF9933]">Question Bank</h5>
              <button 
                onClick={() => setShowAddQ(true)}
                className="text-sm bg-[#FF9933] text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 shadow-md shadow-[#FF9933]/10"
              >
                <PlusCircle size={16} /> Add Question
              </button>
            </div>

            {showAddQ && (
               <form onSubmit={handleAddQuestion} className="bg-white p-6 rounded-2xl shadow-sm border border-[#FF9933]/20 mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Question Type</label>
                    <select 
                      value={newQ.type} 
                      onChange={e => setNewQ({...newQ, type: e.target.value as any})}
                      className="w-full p-3 rounded-xl border border-gray-200"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="descriptive">Descriptive (AI Graded)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Question Text</label>
                    <input required value={newQ.questionText} onChange={e => setNewQ({...newQ, questionText: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                </div>

                {newQ.type === 'mcq' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newQ.options?.map((opt, i) => (
                      <div key={i}>
                        <label className="block text-xs font-bold mb-1">Option {String.fromCharCode(65 + i)}</label>
                        <input required value={opt} onChange={e => {
                          const opts = [...newQ.options!];
                          opts[i] = e.target.value;
                          setNewQ({...newQ, options: opts});
                        }} className="w-full p-2 rounded-lg border border-gray-200" />
                      </div>
                    ))}
                    <div className="md:col-span-2">
                       <label className="block text-sm font-bold mb-1">Correct Answer Index</label>
                       <select 
                        value={newQ.correctOptionIndex} 
                        onChange={e => setNewQ({...newQ, correctOptionIndex: parseInt(e.target.value)})}
                        className="w-full p-3 rounded-xl border border-gray-200"
                        >
                        {newQ.options?.map((_, i) => <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold mb-1">Ideal Answer (For AI Grading)</label>
                    <textarea 
                      required 
                      value={newQ.idealAnswer} 
                      onChange={e => setNewQ({...newQ, idealAnswer: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-200" 
                      rows={4}
                      placeholder="Enter the correct points that the AI should look for in devotee answers..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold mb-1">Explanation</label>
                  <input required value={newQ.explanation} onChange={e => setNewQ({...newQ, explanation: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200" placeholder="Why is this correct?" />
                </div>
                
                <div className="flex gap-3">
                   <button type="button" onClick={() => setShowAddQ(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-[#FF9933] text-white rounded-xl font-bold shadow-lg shadow-[#FF9933]/20">Save Question</button>
                </div>
               </form>
            )}

            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 bg-white rounded-xl border border-gray-100 flex items-start gap-4">
                  <span className="font-bold text-gray-300 text-lg">#{i+1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase tracking-widest">{q.type}</span>
                      <p className="font-medium italic">{q.questionText}</p>
                    </div>
                    {q.type === 'mcq' && q.options && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt, idx) => (
                          <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border ${idx === q.correctOptionIndex ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
