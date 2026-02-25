import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

export interface Snippet {
    id: string;
    title: string;
    content: string;
    tags: string[];
    updatedAt: string;
}

export interface NewSnippetPayload {
    title: string;
    content: string;
    tags?: string[];
}

interface SnippetStoreResponse {
    snippets: Snippet[];
}

interface SnippetsState {
    snippets: Snippet[];
    isLoaded: boolean;
    loadSnippets: () => Promise<void>;
    addSnippet: (payload: NewSnippetPayload) => Promise<void>;
    deleteSnippet: (id: string) => Promise<void>;
}

export const useSnippetStore = create<SnippetsState>((set, get) => ({
    snippets: [],
    isLoaded: false,

    loadSnippets: async () => {
        if (get().isLoaded) return; // Prevent duplicate loads

        try {
            const response = await invoke<SnippetStoreResponse>('load_snippets');
            set({ snippets: response.snippets, isLoaded: true });
        } catch (error) {
            console.error("Failed to load snippets:", error);
            toast.error("Failed to load snippet library.");
            // Still mark as loaded so we don't infinitely retry on corrupted store
            set({ isLoaded: true });
        }
    },

    addSnippet: async (payload: NewSnippetPayload) => {
        try {
            const newSnippet = await invoke<Snippet>('add_snippet', { payload });
            set((state) => ({ snippets: [...state.snippets, newSnippet] }));
            toast.success(`Snippet "${newSnippet.title}" saved.`);
        } catch (error) {
            console.error("Failed to add snippet:", error);
            const msg = typeof error === 'string' ? error : (error as any)?.message || 'Unknown error';
            toast.error(`Failed to save snippet: ${msg}`);
            throw error; // Let UI know it failed (e.g., to keep a modal open)
        }
    },

    deleteSnippet: async (id: string) => {
        try {
            await invoke('delete_snippet', { id });
            set((state) => ({ snippets: state.snippets.filter(s => s.id !== id) }));
            toast.success("Snippet deleted.");
        } catch (error) {
            console.error("Failed to delete snippet:", error);
            toast.error("Failed to delete snippet.");
        }
    }
}));
