import { supabase } from './supabase';

export interface Lecture {
    id: string;
    user_id: string;
    title: string;
    transcript: any[];
    notes: any[];
    summary: string | null;
    created_at: string;
}

export const lectureService = {
    async getLectures() {
        const { data, error } = await supabase
            .from('lectures')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Lecture[];
    },

    async getLecture(id: string) {
        const { data, error } = await supabase
            .from('lectures')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Lecture;
    },

    async createLecture(title: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('lectures')
            .insert([{ title, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as Lecture;
    },

    async updateLecture(id: string, updates: Partial<Lecture>) {
        const { data, error } = await supabase
            .from('lectures')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Lecture;
    },

    async deleteLecture(id: string) {
        const { error } = await supabase
            .from('lectures')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
