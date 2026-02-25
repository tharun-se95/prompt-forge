import { create } from "zustand";

interface LogEntry {
    timestamp: string;
    level: "info" | "warn" | "error";
    message: string;
    data?: any;
}

interface DebugState {
    logs: LogEntry[];
    addLog: (message: string, level?: LogEntry["level"], data?: any) => void;
    clearLogs: () => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    logs: [],
    addLog: (message, level = "info", data) => {
        const entry: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            message,
            data
        };
        set((state) => ({ logs: [entry, ...state.logs].slice(0, 100) }));
        console.log(`[DEBUG][${level.toUpperCase()}] ${message}`, data || "");
    },
    clearLogs: () => set({ logs: [] }),
}));
