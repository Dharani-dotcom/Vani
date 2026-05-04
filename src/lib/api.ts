/**
 * API utility for non-Firebase full-stack setup
 */

const BASE_URL = ''; // Same origin

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  role: 'admin' | 'devotee';
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  bookTitle: string;
  durationMinutes: number;
  totalQuestions: number;
  creatorId: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  examId: string;
  examTitle: string;
  score: number;
  total: number;
  answers: (number | string)[];
  results?: { correct: boolean; score: number }[];
  completedAt: string;
  isCertified?: boolean;
}

export interface Question {
  id: string;
  type: 'mcq' | 'descriptive';
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  idealAnswer?: string;
  explanation: string;
  order: number;
}

export const api = {
  async getExams(): Promise<Exam[]> {
    const res = await fetch(`${BASE_URL}/api/exams`);
    return res.json();
  },

  async getExam(id: string): Promise<Exam> {
    const res = await fetch(`${BASE_URL}/api/exams`);
    const all: Exam[] = await res.json();
    return all.find(e => e.id === id)!;
  },

  async getQuestions(examId: string): Promise<Question[]> {
    const res = await fetch(`${BASE_URL}/api/exams/${examId}/questions`);
    return res.json();
  },

  async createQuestion(examId: string, q: Omit<Question, 'id'>): Promise<Question> {
    const res = await fetch(`${BASE_URL}/api/exams/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    return res.json();
  },
  
  async createExam(exam: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    const res = await fetch(`${BASE_URL}/api/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    return res.json();
  },

  async deleteExam(id: string): Promise<void> {
    await fetch(`${BASE_URL}/api/exams/${id}`, { method: 'DELETE' });
  },

  async getSubmissions(userId?: string): Promise<Submission[]> {
    const res = await fetch(`${BASE_URL}/api/submissions`);
    const all: Submission[] = await res.json();
    if (userId) {
      return all.filter(s => s.userId === userId);
    }
    return all;
  },

  async createSubmission(sub: Omit<Submission, 'id' | 'completedAt'>): Promise<Submission> {
    const res = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    });
    return res.json();
  },

  async certifySubmission(id: string): Promise<void> {
    await fetch(`${BASE_URL}/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCertified: true })
    });
  },

  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch(`${BASE_URL}/api/users`);
    return res.json();
  },

  async login(payload: { email?: string, password?: string, name?: string, type: 'admin' | 'devotee' }): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }
    return res.json();
  }
};
