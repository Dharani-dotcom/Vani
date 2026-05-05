/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api, UserProfile, Exam, Submission, Question } from './lib/api';
import { 
  BookOpen, 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  Clock,
  Award,
  Star,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'dashboard' | 'exam' | 'admin' | 'results'>('home');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  useEffect(() => {
    // Health check
    fetch('/api/health')
      .then(r => r.json())
      .then(d => console.log("API Health:", d))
      .catch(e => console.error("API Health Check Failed:", e));

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setProfile(u);
      if (u.role === 'admin') {
        setView('admin');
      } else {
        setView('dashboard');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (u: UserProfile) => {
    localStorage.setItem('user', JSON.stringify(u));
    setProfile(u);
    if (u.role === 'admin') {
      setView('admin');
    } else {
      setView('dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setProfile(null);
    setView('home');
  };

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
                {profile.role === 'devotee' && (
                  <button 
                    onClick={() => setView('dashboard')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-[#FF9933] text-white' : 'hover:bg-[#FF9933]/10 text-[#FF9933]'}`}
                  >
                    <BookOpen size={20} />
                    <span className="hidden md:inline font-medium">Take Exam</span>
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
             <div />
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeView onLoginSuccess={handleLoginSuccess} />
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

function HomeView({ onLoginSuccess }: { onLoginSuccess: (u: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Admin Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 5) {
      setShowAdminLogin(true);
      setClickCount(0);
    }
  };

  const handleDevoteeStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAuthLoading(true);
    try {
      const u = await api.login({ name, type: 'devotee' });
      onLoginSuccess(u);
    } catch (err: any) {
      console.error("Login Error:", err);
      alert(`Failed to start exam: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const u = await api.login({ email, password, type: 'admin' });
      onLoginSuccess(u);
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
      <div 
        className="mb-8 p-4 bg-[#FF9933]/5 rounded-full cursor-pointer active:scale-95 transition-transform"
        onClick={handleSecretClick}
      >
         <BookOpen size={64} className="text-[#FF9933]" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
        Srila Prabhupada <br />
        <span className="text-[#FF9933]">Exam Portal</span>
      </h1>
      <p className="text-xl text-gray-600 mb-10 leading-relaxed">
        Test your realization of the transcendental knowledge presented in Prabhupada's books.
      </p>

      {!showAdminLogin ? (
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-6">Enter Your Name to Start</h2>
          <form onSubmit={handleDevoteeStart} className="space-y-4">
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your Full Name (Devotee Name)"
              className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#FF9933] outline-none text-center text-lg font-medium"
            />
            <button 
              type="submit"
              disabled={authLoading || !name.trim()}
              className="w-full py-4 bg-[#FF9933] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#FF9933]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="animate-spin" /> : "Enter Exam Hall"}
              {!authLoading && <ChevronRight size={22} />}
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-6">Admin Sign In</h2>
          <form onSubmit={handleAdminAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" placeholder="••••••••" />
            </div>
            {authError && <p className="text-xs text-red-500 font-medium">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full py-4 bg-[#2D2D2D] text-white rounded-xl font-bold shadow-lg flex items-center justify-center">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign In as Admin"}
            </button>
            <div className="flex flex-col gap-2 mt-4 text-center">
              <button type="button" onClick={() => setShowAdminLogin(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Back to Devotee Entry</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left opacity-60">
        {[
          { title: 'Authorized Knowledge', desc: 'Questions strictly based on Srila Prabhupada\'s original teachings.', icon: BookOpen },
          { title: 'Digital Certificates', desc: 'Receive a token of appreciation upon successful completion.', icon: Award },
          { title: 'Simple Access', desc: 'No complex registration required for devotees to begin.', icon: CheckCircle2 },
        ].map((feat, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100">
            <feat.icon className="text-[#FF9933] mb-4" size={24} />
            <h3 className="font-bold text-base mb-1">{feat.title}</h3>
            <p className="text-xs text-gray-500">{feat.desc}</p>
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
        const examList = await api.getExams();
        setExams(examList);
      } catch (error) {
        console.error("Exam fetch failed", error);
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
        const examData = await api.getExam(examId);
        if (examData) {
          setExam(examData);
          const qList = await api.getQuestions(examId);
          setQuestions(qList.sort((a, b) => a.order - b.order));
          setAnswers(new Array(qList.length).fill(-1));
        }
      } catch (error) {
        console.error("Content load failed", error);
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
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    try {
      const submissionAnswers = questions.map((q, i) => ({
        questionId: q.id,
        answer: answers[i]
      }));

      const submission: Omit<Submission, 'id' | 'completedAt'> = {
        userId,
        userName: JSON.parse(localStorage.getItem('user') || '{}').displayName || 'Devotee',
        examId,
        examTitle: exam?.title || 'Unknown Exam',
        score: 0, // Server will calculate for MCQs
        totalPoints: questions.reduce((acc, q) => acc + (q.points || 1), 0),
        status: exam?.type === 'mcq' ? 'graded' : 'pending',
        answers: submissionAnswers,
      };

      await api.createSubmission(submission);
      onComplete();
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="flex items-center gap-2 mb-4 text-[#FF9933] font-bold text-sm tracking-wider uppercase">
             <Star size={16} /> {currentQuestion.points || 1} Marks
          </div>
          
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
            <button 
              onClick={nextQuestion}
              disabled={answers[currentIndex] === -1 || isSubmitting}
              className="w-full bg-[#FF9933] text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-[#FF9933]/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
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
  const [showCertificateFor, setShowCertificateFor] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const list = await api.getSubmissions(userId);
        setSubmissions(list.sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
      } catch (error) {
        console.error("Fetch submissions failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [userId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#FF9933]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Exam History</h2>
        {submissions.some(s => s.isCertified) && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">Check below for signed certificates!</span>
        )}
      </div>

      {showCertificateFor && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-3xl">
            <button 
              onClick={() => setShowCertificateFor(null)}
              className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold hover:text-[#FF9933] transition-colors"
            >
              <XCircle size={24} /> Close
            </button>
            <CertificateView submission={showCertificateFor} />
            <div className="mt-6 flex justify-center no-print">
               <button 
                onClick={() => window.print()} 
                className="bg-[#FF9933] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
               >
                 Print Certificate
               </button>
            </div>
          </div>
        </motion.div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-3xl border border-gray-100">
          <Award size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-medium text-gray-400">No exams completed yet.</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((s) => {
            const percentage = s.totalPoints > 0 ? Math.round((s.score / s.totalPoints) * 100) : 0;
            const isExpanded = viewingDetailId === s.id;
            const passed = percentage >= 80;
            const certified = s.isCertified;

            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setViewingDetailId(isExpanded ? null : s.id)}
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{s.examTitle}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {new Date(s.completedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <LayoutDashboard size={16} />
                        {s.totalPoints} Questions
                      </span>
                      {s.status === 'pending' && (
                        <span className="flex items-center gap-1 text-blue-500 font-bold">
                          <Clock size={16} />
                          Awaiting Manual Grading
                        </span>
                      )}
                      {certified && (
                        <span className="flex items-center gap-1 text-green-600 font-bold">
                          <CheckCircle2 size={16} />
                          Signed by Admin
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {certified && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowCertificateFor(s); }}
                        className="bg-white border-2 border-green-500 text-green-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Award size={16} /> View Certificate
                      </button>
                    )}
                    {s.status === 'pending' ? (
                      <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border-2 border-blue-100">
                        In Correction
                      </div>
                    ) : (
                      <>
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-[#FF9933]">{s.score}/{s.totalPoints}</div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Score</div>
                        </div>
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-lg
                          ${percentage >= 80 ? 'border-green-500 text-green-600' : percentage >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                          {percentage}%
                        </div>
                      </>
                    )}
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
                             <div key={idx} className="text-sm p-2 bg-gray-50 rounded-lg text-gray-600">
                               <span className="font-bold mr-2 text-gray-400">Q{idx+1}:</span> 
                               {typeof ans === 'number' ? `Option ${String.fromCharCode(65 + ans)}` : ans}
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

function CertificateView({ submission }: { submission: Submission }) {
  const percentage = submission.totalPoints > 0 ? Math.round((submission.score / submission.totalPoints) * 100) : 0;
  
  return (
    <div className="bg-white p-16 shadow-2xl relative overflow-hidden border-[16px] border-[#FF9933]/10 print:shadow-none print:border-[#FF9933] print:p-8 certificate-content" id="certificate-content">
      {/* Background Ornament */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9933]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF9933]/5 rounded-full -ml-32 -mb-32 blur-3xl" />
      
      <div className="relative border-4 border-[#FF9933]/20 p-12 flex flex-col items-center text-center">
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-[#FF9933] rounded-3xl rotate-45 flex items-center justify-center text-white mb-8 shadow-xl shadow-[#FF9933]/30">
             <div className="-rotate-45 font-black text-3xl">ISKM</div>
          </div>
          <h1 className="text-4xl font-black text-[#2D2D2D] tracking-tighter uppercase mb-1">International Sri Krishna Mandir</h1>
          <p className="text-[#FF9933] font-bold tracking-[0.3em] text-xs uppercase underline decoration-2 underline-offset-4 decoration-[#FF9933]/20">Bhaktivedanta Academy of Education</p>
        </div>

        <div className="mb-10">
          <h2 className="text-6xl font-serif italic text-gray-800 mb-2">Certificate of Achievement</h2>
          <div className="h-1.5 w-64 bg-gradient-to-r from-transparent via-[#FF9933] to-transparent mx-auto rounded-full" />
        </div>

        <p className="text-xl text-gray-500 mb-6 font-medium italic">This is to certify that</p>
        
        <h3 className="text-5xl font-bold text-[#2D2D2D] mb-10 pb-2 border-b-2 border-gray-100 min-w-[400px]">
          {submission.userName}
        </h3>

        <p className="max-w-xl mx-auto text-gray-500 leading-relaxed text-lg mb-12">
          has successfully demonstrated exceptional proficiency in the examination on <br/>
          <span className="font-bold text-[#2D2D2D] text-2xl group block mt-2">"{submission.examTitle}"</span> <br/>
          achieving a grade of <span className="text-[#FF9933] font-black">{percentage}%</span> and gaining deep spiritual realizations 
          according to the teachings of <span className="font-bold text-gray-700 italic">Srila Prabhupada</span>.
        </p>

        <div className="grid grid-cols-2 gap-20 w-full max-w-2xl items-end mt-12 bg-gray-50/50 p-8 rounded-3xl">
          <div className="text-center">
            <div className="h-px bg-gray-300 w-full mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Date Issued</p>
            <p className="font-bold text-gray-800 text-lg">{new Date(submission.completedAt).toLocaleDateString()}</p>
          </div>
          <div className="text-center relative">
             {/* Signature Mock */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-20 opacity-80 pointer-events-none select-none">
               <div className="font-serif italic text-4xl text-[#1A1A1A] skew-x-[-15deg] opacity-60">Admin Authority</div>
            </div>
            <div className="h-px bg-gray-300 w-full mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Administrative Head</p>
            <p className="font-bold text-[#FF9933] text-lg">Srila Prabhupada's Servants</p>
          </div>
        </div>

        <div className="mt-12 text-[9px] text-gray-300 font-mono tracking-widest uppercase flex items-center gap-4">
          <span>Auth ID: {submission.id.split('-')[0].toUpperCase()}</span>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>Blockchain Verified Certificate</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .certificate-content, .certificate-content * { visibility: visible !important; }
          .certificate-content { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100vw !important; 
            height: 100vh !important; 
            margin: 0 !important;
            padding: 2cm !important;
            border-width: 25px !important;
            box-shadow: none !important;
            z-index: 9999 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}

function AdminPanel() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions' | 'admins'>('exams');
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '', description: '', bookTitle: '', durationMinutes: 30, type: 'mcq'
  });

  const [newAdminData, setNewAdminData] = useState({
    email: '', password: '', name: ''
  });
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [manualGrade, setManualGrade] = useState({ score: 0, feedback: '' });
  const [gradingLoading, setGradingLoading] = useState(false);
  const [viewingAdminCertificate, setViewingAdminCertificate] = useState<Submission | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = async () => {
    setLoading(true);
    try {
      const examList = await api.getExams();
      setExams(examList);
      
      const subList = await api.getSubmissions();
      setAllSubmissions(subList.sort((a,b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));

      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err) { console.error("Load admin data failed", err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const examData: Omit<Exam, 'id' | 'createdAt'> = {
        title: newExam.title || '',
        bookTitle: newExam.bookTitle || '',
        description: newExam.description || '',
        durationMinutes: newExam.durationMinutes || 30,
        type: (newExam.type as 'mcq' | 'descriptive') || 'mcq',
        creatorId: currentUser.uid,
        totalPoints: 0,
      };
      await api.createExam(examData);
      setShowAddExam(false);
      setNewExam({ title: '', description: '', bookTitle: '', durationMinutes: 30, type: 'mcq' });
      loadData();
    } catch (err) { console.error("Create exam failed", err); }
  };

  const handleManualGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGradingLoading(true);
    try {
      await api.gradeSubmission(gradingSubmission.id, currentUser.uid, manualGrade);
      setGradingSubmission(null);
      setManualGrade({ score: 0, feedback: '' });
      loadData();
    } catch (err) {
      console.error("Manual grading failed", err);
    } finally {
      setGradingLoading(false);
    }
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
          <button 
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'admins' ? 'bg-white shadow-sm text-[#FF9933]' : 'text-gray-500'}`}
          >
            Admins
          </button>
        </div>
      </div>

      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-sm">System Administrators</h3>
            <button 
              onClick={() => setShowAddAdmin(true)}
              className="bg-[#2D2D2D] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              <PlusCircle size={20} /> Add New Admin
            </button>
          </div>

          {showAddAdmin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">Create New Admin Account</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAdminActionLoading(true);
                  setAdminActionError(null);
                  try {
                    await api.createAdmin(currentUser.uid, newAdminData);
                    setShowAddAdmin(false);
                    setNewAdminData({ email: '', password: '', name: '' });
                    loadData();
                  } catch (err: any) {
                    setAdminActionError(err.message);
                  } finally {
                    setAdminActionLoading(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input required value={newAdminData.name} onChange={e => setNewAdminData({...newAdminData, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input required type="email" value={newAdminData.email} onChange={e => setNewAdminData({...newAdminData, email: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                    <input required type="password" value={newAdminData.password} onChange={e => setNewAdminData({...newAdminData, password: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF9933] outline-none" />
                  </div>
                  {adminActionError && <p className="text-xs text-red-500 font-medium">{adminActionError}</p>}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddAdmin(false)} className="flex-1 py-3 px-6 border-2 border-gray-100 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={adminActionLoading} className="flex-1 py-3 px-6 bg-[#FF9933] text-white rounded-xl font-bold shadow-lg shadow-[#FF9933]/20 flex items-center justify-center gap-2">
                      {adminActionLoading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Create"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.filter(u => u.role === 'admin').map((admin) => (
                  <tr key={admin.uid} className="hover:bg-gray-50/50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold">{admin.displayName}</td>
                    <td className="px-6 py-4">{admin.email}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                    <label className="block text-sm font-bold text-gray-700 mb-1">Exam Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        onClick={() => setNewExam({...newExam, type: 'mcq'})}
                        className={`py-2 rounded-xl font-bold text-sm border-2 transition-all ${newExam.type === 'mcq' ? 'border-[#FF9933] bg-[#FF9933]/5 text-[#FF9933]' : 'border-gray-100 text-gray-400'}`}
                      >
                        MCQ Quiz
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setNewExam({...newExam, type: 'descriptive'})}
                        className={`py-2 rounded-xl font-bold text-sm border-2 transition-all ${newExam.type === 'descriptive' ? 'border-[#FF9933] bg-[#FF9933]/5 text-[#FF9933]' : 'border-gray-100 text-gray-400'}`}
                      >
                        Descriptive
                      </button>
                    </div>
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
                  <th className="px-6 py-4 text-center">Signature</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSubmissions.map((s) => {
                  const student = users.find(u => u.uid === s.userId);
                  const percentage = s.totalPoints > 0 ? (s.score / s.totalPoints) : 0;
                  const canCertify = percentage >= 0.8 && s.status === 'graded';
                  const needsGrading = s.status === 'pending';
                  const isCertified = s.isCertified;
                  
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="px-6 py-4">
                        <div className="font-bold">{s.userName || student?.displayName || 'Unknown'}</div>
                        <div className="text-[10px] text-gray-400">{student?.email || 'Anonymous'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{s.examTitle}</div>
                        {needsGrading && <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Descriptive</div>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`font-bold ${needsGrading ? 'text-gray-300' : canCertify ? 'text-green-600' : 'text-[#FF9933]'}`}>
                          {needsGrading ? 'Pending' : `${s.score}/${s.totalPoints}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          {needsGrading ? (
                            <button 
                              onClick={() => {
                                setGradingSubmission(s);
                                setManualGrade({ score: 0, feedback: '' });
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors"
                            >
                              Grade Now
                            </button>
                          ) : (
                            <>
                              {isCertified ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                                  <CheckCircle2 size={12} /> Signed
                                </span>
                              ) : canCertify ? (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await api.certifySubmission(s.id);
                                      loadData();
                                    } catch (e) { console.error("Sign failed", e); }
                                  }}
                                  className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
                                >
                                  Sign Certificate
                                </button>
                              ) : (
                                <span className="text-gray-300 text-[10px] uppercase tracking-wider">Ineligible</span>
                              )}
                              
                              {isCertified && (
                                <button 
                                  onClick={() => setViewingAdminCertificate(s)}
                                  className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-[#FF9933]/10 hover:text-[#FF9933] transition-colors"
                                  title="View/Print PDF Certificate"
                                >
                                  <FileText size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(s.completedAt).toLocaleDateString()}
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

      {/* Admin Certificate Preview */}
      {viewingAdminCertificate && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white rounded-3xl flex flex-col shadow-2xl">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 no-print">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-xl font-bold">Certificate Editor</h3>
                  <p className="text-xs text-gray-500">Edit details below to customize the certificate before printing.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Student Name</span>
                    <input 
                      className="text-sm p-1 border-b border-gray-300 focus:border-[#FF9933] outline-none" 
                      value={viewingAdminCertificate.userName || ''} 
                      onChange={(e) => setViewingAdminCertificate({...viewingAdminCertificate, userName: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Exam Title</span>
                    <input 
                      className="text-sm p-1 border-b border-gray-300 focus:border-[#FF9933] outline-none" 
                      value={viewingAdminCertificate.examTitle || ''} 
                      onChange={(e) => setViewingAdminCertificate({...viewingAdminCertificate, examTitle: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Final Score</span>
                    <input 
                      type="number"
                      className="text-sm p-1 border-b border-gray-300 focus:border-[#FF9933] outline-none w-16" 
                      value={viewingAdminCertificate.score} 
                      onChange={(e) => setViewingAdminCertificate({...viewingAdminCertificate, score: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => window.print()}
                  className="bg-[#FF9933] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#FF9933]/20 hover:scale-105 transition-transform"
                >
                  <Printer size={20} /> Print / Save PDF
                </button>
                <button 
                  onClick={() => setViewingAdminCertificate(null)}
                  className="bg-white border border-gray-200 text-gray-500 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="max-w-4xl mx-auto origin-top scale-90 md:scale-100">
                <CertificateView submission={viewingAdminCertificate} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Grade Descriptive Paper</h3>
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mt-1">{gradingSubmission.examTitle}</p>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><XCircle size={24} className="text-gray-400" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-200">
                <span className="font-bold">Student:</span> {gradingSubmission.userName}
              </div>

              {gradingSubmission.answers.map((ans, idx) => (
                <div key={idx} className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100">
                  <div className="text-[10px] font-black text-[#FF9933] uppercase tracking-widest mb-2">Question {idx + 1}</div>
                  <p className="text-lg font-bold mb-4 italic text-gray-600">"{ans.answer || '(No answer provided)'}"</p>
                </div>
              ))}
              
              <form onSubmit={handleManualGrade} className="space-y-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Score (Out of {gradingSubmission.totalPoints})</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      max={gradingSubmission.totalPoints} 
                      min={0}
                      required 
                      value={manualGrade.score} 
                      onChange={e => setManualGrade({...manualGrade, score: parseFloat(e.target.value)})}
                      className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-[#FF9933] outline-none font-bold text-xl text-[#FF9933]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Feedback</label>
                    <input 
                      value={manualGrade.feedback} 
                      onChange={e => setManualGrade({...manualGrade, feedback: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none" 
                      placeholder="Excellent realization..." 
                    />
                  </div>
                </div>
                <button type="submit" disabled={gradingLoading} className="w-full py-4 bg-[#FF9933] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-[#FF9933]/20">
                  {gradingLoading ? <Loader2 className="animate-spin" /> : "Save Marks & Finalize"}
                </button>
              </form>
            </div>
          </motion.div>
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
    type: 'mcq', questionText: '', points: 1, options: ['', '', '', ''], correctOptionIndex: 0, explanation: '', idealAnswer: ''
  });

  const loadQuestions = async () => {
    try {
      const qList = await api.getQuestions(exam.id);
      setQuestions(qList);
    } catch (e) { console.error("Load questions failed", e); }
  };

  useEffect(() => { if (expanded) loadQuestions(); }, [expanded]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const qData: Omit<Question, 'id'> = {
        type: newQ.type || 'mcq',
        questionText: newQ.questionText || '',
        points: Number(newQ.points) || 1,
        options: newQ.options,
        correctOptionIndex: newQ.correctOptionIndex,
        explanation: newQ.explanation || '',
        idealAnswer: newQ.idealAnswer || '',
        order: questions.length
      };
      await api.createQuestion(exam.id, qData);
      setShowAddQ(false);
      setNewQ({ type: 'mcq', questionText: '', points: 1, options: ['', '', '', ''], correctOptionIndex: 0, explanation: '', idealAnswer: '' });
      loadQuestions();
      onRefresh();
    } catch (err) { console.error("Add question failed", err); }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold">{exam.title}</h4>
          <p className="text-sm text-gray-500">{exam.bookTitle} • {exam.totalPoints} Marks</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Question Type</label>
                    <select 
                      value={newQ.type} 
                      onChange={e => setNewQ({...newQ, type: e.target.value as any})}
                      className="w-full p-3 rounded-xl border border-gray-200"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="descriptive">Descriptive (Manual Grading)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Marks / Points</label>
                    <input 
                      type="number" 
                      required 
                      min={1} 
                      max={100} 
                      value={newQ.points} 
                      onChange={e => setNewQ({...newQ, points: parseInt(e.target.value)})} 
                      className="w-32 p-3 rounded-xl border-2 border-orange-100 focus:border-[#FF9933] outline-none font-bold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Question Text</label>
                  <input required value={newQ.questionText} onChange={e => setNewQ({...newQ, questionText: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200" />
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
                    <label className="block text-sm font-bold mb-1">Ideal Answer (For Reference)</label>
                    <textarea 
                      required 
                      value={newQ.idealAnswer} 
                      onChange={e => setNewQ({...newQ, idealAnswer: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-gray-200" 
                      rows={4}
                      placeholder="Enter the correct points to check for during manual grading..."
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
