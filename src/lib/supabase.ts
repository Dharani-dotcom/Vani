import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

export const supabase = {
  from: (table: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings.');
      return { 
        select: () => ({ error: { message: "Supabase not configured" } }),
        insert: () => ({ select: () => ({ single: () => ({ error: { message: "Supabase not configured" } }) }) }),
        delete: () => ({ eq: () => ({ error: { message: "Supabase not configured" } }) }),
        eq: () => ({ error: { message: "Supabase not configured" } }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ error: { message: "Supabase not configured" } }) }) }) }),
      } as any;
    }

    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient.from(table);
  }
};
