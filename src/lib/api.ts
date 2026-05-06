/**
 * API utility for non-Firebase full-stack setup
 */

import { supabase } from './supabase';

const BASE_URL = ''; // Same origin

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  role: 'admin' | 'devotee';
  isSuperAdmin?: boolean;
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
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    // Map camelCase if needed, but assuming snake_case in Supabase and mapping here
    return (data || []).map(e => ({
      ...e,
      bookTitle: e.book_title,
      durationMinutes: e.duration_minutes,
      totalPoints: e.total_points,
      creatorId: e.creator_id,
      createdAt: e.created_at
    })) as Exam[];
  },

  async getExam(id: string): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return {
      ...data,
      bookTitle: data.book_title,
      durationMinutes: data.duration_minutes,
      totalPoints: data.total_points,
      creatorId: data.creator_id,
      createdAt: data.created_at
    } as Exam;
  },

  async getQuestions(examId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('questions')
      .eq('id', examId)
      .single();
    
    if (error) throw error;
    return (data?.questions || []) as Question[];
  },

  async createQuestion(examId: string, q: Omit<Question, 'id'>): Promise<Question> {
    const exam = await this.getExam(examId);
    const questions = exam.questions || [];
    const newQuestion = { ...q, id: crypto.randomUUID() };
    questions.push(newQuestion as any);

    const { error } = await supabase
      .from('exams')
      .update({ 
        questions,
        total_points: questions.reduce((acc, curr) => acc + (curr.points || 1), 0)
      })
      .eq('id', examId);

    if (error) throw error;
    return newQuestion as any;
  },
  
  async createExam(exam: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .insert({
        title: exam.title,
        description: exam.description,
        book_title: exam.bookTitle,
        duration_minutes: exam.durationMinutes,
        total_points: exam.totalPoints,
        type: exam.type,
        creator_id: exam.creatorId,
        questions: exam.questions || []
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      bookTitle: data.book_title,
      durationMinutes: data.duration_minutes,
      totalPoints: data.total_points,
      creatorId: data.creator_id,
      createdAt: data.created_at
    } as Exam;
  },

  async deleteExam(id: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getSubmissions(userId?: string): Promise<Submission[]> {
    let query = supabase.from('submissions').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('completed_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      userId: s.user_id,
      userName: s.user_name,
      examId: s.exam_id,
      examTitle: s.exam_title,
      totalPoints: s.total_points,
      completedAt: s.completed_at,
      isCertified: s.is_certified
    })) as Submission[];
  },

  async createSubmission(sub: Omit<Submission, 'id' | 'completedAt'>): Promise<Submission> {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        user_id: sub.userId,
        user_name: sub.userName,
        exam_id: sub.examId,
        exam_title: sub.examTitle,
        score: sub.score,
        total_points: sub.totalPoints,
        status: sub.status,
        feedback: sub.feedback,
        answers: sub.answers
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      userName: data.user_name,
      examId: data.exam_id,
      examTitle: data.exam_title,
      totalPoints: data.total_points,
      completedAt: data.completed_at,
      isCertified: data.is_certified
    } as Submission;
  },

  async certifySubmission(id: string): Promise<void> {
    const { error } = await supabase
      .from('submissions')
      .update({ is_certified: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      uid: p.id,
      displayName: p.display_name,
      isSuperAdmin: p.is_super_admin,
      createdAt: p.created_at
    })) as UserProfile[];
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
    const { data: result, error } = await supabase
      .from('submissions')
      .update({
        score: data.score,
        feedback: data.feedback,
        status: 'graded',
        graded_by: adminId,
        graded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...result,
      userId: result.user_id,
      userName: result.user_name,
      examId: result.exam_id,
      examTitle: result.exam_title,
      totalPoints: result.total_points,
      completedAt: result.completed_at,
      isCertified: result.is_certified
    } as Submission;
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
  },

  async deleteAdmin(adminId: string, targetId: string): Promise<void> {
    await this.fetchWithLog(`/api/admin/${targetId}?adminId=${adminId}`, {
      method: 'DELETE'
    });
  },

  async transferSuperPower(adminId: string, targetAdminId: string): Promise<void> {
    await this.fetchWithLog('/api/admin/transfer-super', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetAdminId })
    });
  }
};

