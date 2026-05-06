/**
 * API utility for Supabase persistent storage
 */

import { supabase } from './supabase';

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
  totalQuestions?: number;
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
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
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
    const questions = await this.getQuestions(examId);
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
    console.log("DEBUG: Creating exam", exam);
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

    if (error) {
       console.error("DEBUG: Supabase error creating exam:", error);
       throw error;
    }
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
    // For now, this still needs your backend implementation, but it now acts as a bridge.
    // If you want fully client-side persistence, we would refactor this further.
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
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
    const res = await fetch('/api/admin/create', {
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
    await fetch(`/api/admin/${targetId}?adminId=${adminId}`, {
      method: 'DELETE'
    });
  },

  async transferSuperPower(adminId: string, targetAdminId: string): Promise<void> {
    await fetch('/api/admin/transfer-super', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetAdminId })
    });
  }
};
