import { create } from "zustand";
import Database from "@tauri-apps/plugin-sql";

export interface HistoryEntry {
    id?: number;
    timestamp: string;
    personaName: string;
    goal: string;
    prompt: string;
    response: string;
    model: string;
}

interface HistoryState {
    history: HistoryEntry[];
    loadHistory: () => Promise<void>;
    addEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => Promise<void>;
    clearHistory: () => Promise<void>;
}

const DB_PATH = "sqlite:promptforge.db";

export const useHistoryStore = create<HistoryState>((set) => ({
    history: [],

    loadHistory: async () => {
        try {
            const db = await Database.load(DB_PATH);

            // Create table if not exists
            await db.execute(`
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    personaName TEXT,
                    goal TEXT,
                    prompt TEXT,
                    response TEXT,
                    model TEXT
                )
            `);

            const rows = await db.select<HistoryEntry[]>("SELECT * FROM history ORDER BY timestamp DESC");
            set({ history: rows });
        } catch (error) {
            console.error("Failed to load history from SQLite:", error);
        }
    },

    addEntry: async (entry) => {
        try {
            const db = await Database.load(DB_PATH);
            await db.execute(
                "INSERT INTO history (personaName, goal, prompt, response, model) VALUES ($1, $2, $3, $4, $5)",
                [entry.personaName, entry.goal, entry.prompt, entry.response, entry.model]
            );

            // Refresh local state
            const rows = await db.select<HistoryEntry[]>("SELECT * FROM history ORDER BY timestamp DESC");
            set({ history: rows });
        } catch (error) {
            console.error("Failed to add history entry:", error);
        }
    },

    clearHistory: async () => {
        try {
            const db = await Database.load(DB_PATH);
            await db.execute("DELETE FROM history");
            set({ history: [] });
        } catch (error) {
            console.error("Failed to clear history:", error);
        }
    }
}));
