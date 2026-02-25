import { create } from "zustand";
import Database from "@tauri-apps/plugin-sql";
import { useDebugStore } from "./debug";

export interface HistoryEntry {
    id?: number;
    timestamp: string;
    personaName: string;
    goal: string;
    context: string;
    personaId: string;
    constraints: string;
    outputFormat: string;
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
        const { addLog } = useDebugStore.getState();
        addLog("Initializing History Store...", "info");
        try {
            const db = await Database.load(DB_PATH);
            addLog("Database connected successfully", "info");

            // Create table if not exists - Simplified schema for first pass
            await db.execute(`
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    personaName TEXT,
                    personaId TEXT,
                    goal TEXT,
                    context TEXT,
                    constraints TEXT,
                    outputFormat TEXT,
                    prompt TEXT,
                    response TEXT,
                    model TEXT
                )
            `);
            addLog("history table verified/created", "info");

            // Check columns
            const columns = ["personaId", "context", "constraints", "outputFormat"];
            for (const col of columns) {
                try {
                    await db.execute(`ALTER TABLE history ADD COLUMN ${col} TEXT`);
                    addLog(`Migration: added column ${col}`, "info");
                } catch (e) {
                    // Ignore already exists
                }
            }

            const rows = await db.select<HistoryEntry[]>("SELECT * FROM history ORDER BY timestamp DESC");
            addLog(`History loaded. Total entries: ${rows.length}`, "info");
            set({ history: rows });
        } catch (error: any) {
            addLog(`CRITICAL ERROR in loadHistory: ${error.message || JSON.stringify(error)}`, "error");
            console.error("Failed to load history:", error);
        }
    },

    addEntry: async (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
        const { addLog } = useDebugStore.getState();
        addLog(`Attempting to save history entry: ${entry.goal.substring(0, 30)}...`, "info");
        try {
            const db = await Database.load(DB_PATH);
            const result = await db.execute(
                "INSERT INTO history (personaName, personaId, goal, context, constraints, outputFormat, prompt, response, model) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    entry.personaName || "No Persona",
                    entry.personaId || "",
                    entry.goal || "",
                    entry.context || "",
                    entry.constraints || "",
                    entry.outputFormat || "",
                    entry.prompt || "",
                    entry.response || "",
                    entry.model || ""
                ]
            );
            addLog("Database INSERT successful", "info", { rowsAffected: result.rowsAffected });

            const rows = await db.select<HistoryEntry[]>("SELECT * FROM history ORDER BY timestamp DESC");
            addLog(`Refreshed local state. Total records: ${rows.length}`, "info");
            set({ history: rows });
        } catch (error: any) {
            addLog(`Failed to save history: ${error.message || JSON.stringify(error)}`, "error");
            console.error("Failed to save history:", error);
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
