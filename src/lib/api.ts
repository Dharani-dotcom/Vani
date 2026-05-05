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
  totalPoints: number;
  type: 'mcq' | 'descriptive';
  creatorId: string;
  createdAt: string;
  questions?: Question[];
}

export interface Submission {
  id: string;
  userId: string;
  userName?: string;
  examId: string;
  examTitle: string;
  score: number;
  totalPoints: number;
  status: 'pending' | 'graded';
  feedback?: string;
  answers: { questionId: string; answer: string | number }[];
  completedAt: string;
  isCertified?: boolean;
}

export interface Question {
  id: string;
  type: 'mcq' | 'descriptive';
  questionText: string;
  points: number;
  options?: string[];
  correctOptionIndex?: number;
  idealAnswer?: string;
  explanation: string;
  order: number;
}

export const api = {
  async fetchWithLog(url: string, options?: RequestInit) {
    console.log(`API Request: ${options?.method || 'GET'} ${url}`);
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      let msg = `Server error ${res.status}: ${text.slice(0, 100)}`;
      if (text.startsWith('<!DOCTYPE html>') || text.startsWith('The page')) {
        msg = `Backend unreachable or returned HTML. (Status ${res.status})`;
      }
      throw new Error(msg);
    }
    return res;
  },

  async getExams(): Promise<Exam[]> {
    const res = await this.fetchWithLog('/api/exams');
    return res.json();
  },

  async getExam(id: string): Promise<Exam> {
    const res = await this.fetchWithLog('/api/exams');
    const all: Exam[] = await res.json();
    return all.find(e => e.id === id)!;
  },

  async getQuestions(examId: string): Promise<Question[]> {
    const res = await this.fetchWithLog(`/api/exams/${examId}/questions`);
    return res.json();
  },

  async createQuestion(examId: string, q: Omit<Question, 'id'>): Promise<Question> {
    const res = await this.fetchWithLog(`/api/exams/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    return res.json();
  },
  
  async createExam(exam: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    const res = await this.fetchWithLog('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    return res.json();
  },

  async deleteExam(id: string): Promise<void> {
    await this.fetchWithLog(`/api/exams/${id}`, { method: 'DELETE' });
  },

  async getSubmissions(userId?: string): Promise<Submission[]> {
    const res = await this.fetchWithLog('/api/submissions');
    const all: Submission[] = await res.json();
    if (userId) {
      return all.filter(s => s.userId === userId);
    }
    return all;
  },

  async createSubmission(sub: Omit<Submission, 'id' | 'completedAt'>): Promise<Submission> {
    const res = await this.fetchWithLog('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    });
    return res.json();
  },

  async certifySubmission(id: string): Promise<void> {
    await this.fetchWithLog(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCertified: true })
    });
  },

  async getUsers(): Promise<UserProfile[]> {
    const res = await this.fetchWithLog('/api/users');
    return res.json();
  },

  async login(payload: { email?: string, password?: string, name?: string, type: 'admin' | 'devotee' }): Promise<UserProfile> {
    const res = await this.fetchWithLog('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    try {
      return await res.json();
    } catch (e) {
      console.error("JSON parse error for login:", e);
      throw new Error("Server response was not valid JSON. Ensure backend is running.");
    }
  },
  
  async gradeSubmission(id: string, adminId: string, data: { score: number, feedback: string }): Promise<Submission> {
    const res = await this.fetchWithLog(`/api/submissions/${id}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, adminId })
    });
    return res.json();
  },
  
  async createAdmin(adminId: string, newAdminData: { email: string, password: string, name: string }): Promise<UserProfile> {
    const res = await this.fetchWithLog('/api/admin/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminId,
        newAdminEmail: newAdminData.email,
        newAdminPassword: newAdminData.password,
        newAdminName: newAdminData.name
      })
    });
    return res.json();
  }
};

