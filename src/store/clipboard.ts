import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClipboardItem {
    id: string;
    content: string;
    timestamp: number;
}

interface ClipboardState {
    history: ClipboardItem[];
    selectedIds: string[];
    addHistoryItem: (content: string) => void;
    removeHistoryItem: (id: string) => void;
    clearHistory: () => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
}

export const useClipboardStore = create<ClipboardState>()(
    persist(
        (set) => ({
            history: [],
            selectedIds: [],
            addHistoryItem: (content: string) => {
                if (!content.trim()) return;

                set((state) => {
                    // Avoid duplicates if the same thing is copied twice in a row
                    if (state.history.length > 0 && state.history[0].content === content) {
                        return state;
                    }

                    const newItem: ClipboardItem = {
                        id: crypto.randomUUID(),
                        content,
                        timestamp: Date.now(),
                    };

                    // Keep last 50 items
                    const newHistory = [newItem, ...state.history].slice(0, 50);
                    return { history: newHistory };
                });
            },
            removeHistoryItem: (id: string) => {
                set((state) => ({
                    history: state.history.filter((item) => item.id !== id),
                    selectedIds: state.selectedIds.filter((sid) => sid !== id)
                }));
            },
            clearHistory: () => {
                set({ history: [], selectedIds: [] });
            },
            toggleSelection: (id: string) => {
                set((state) => ({
                    selectedIds: state.selectedIds.includes(id)
                        ? state.selectedIds.filter((sid) => sid !== id)
                        : [...state.selectedIds, id]
                }));
            },
            clearSelection: () => {
                set({ selectedIds: [] });
            }
        }),
        {
            name: "clipboard-history",
        }
    )
);
