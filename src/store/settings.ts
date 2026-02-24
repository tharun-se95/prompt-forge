import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

interface SettingsState {
    openAiKey: string;
    claudeKey: string;
    geminiKey: string;
    ollamaUrl: string;
    defaultModel: string;
    isLoaded: boolean;
    setOpenAiKey: (key: string) => Promise<void>;
    setClaudeKey: (key: string) => Promise<void>;
    setGeminiKey: (key: string) => Promise<void>;
    setOllamaUrl: (url: string) => Promise<void>;
    setDefaultModel: (model: string) => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    openAiKey: "",
    claudeKey: "",
    geminiKey: "",
    ollamaUrl: "http://localhost:11434",
    defaultModel: "gpt-4o",
    isLoaded: false,

    setOpenAiKey: async (key: string) => {
        const store = await load("settings.json", { autoSave: false, defaults: {} });
        await store.set("openAiKey", key);
        await store.save();
        set({ openAiKey: key });
    },

    setClaudeKey: async (key: string) => {
        const store = await load("settings.json", { autoSave: false, defaults: {} });
        await store.set("claudeKey", key);
        await store.save();
        set({ claudeKey: key });
    },

    setGeminiKey: async (key: string) => {
        const store = await load("settings.json", { autoSave: false, defaults: {} });
        await store.set("geminiKey", key);
        await store.save();
        set({ geminiKey: key });
    },

    setOllamaUrl: async (url: string) => {
        const store = await load("settings.json", { autoSave: false, defaults: {} });
        await store.set("ollamaUrl", url);
        await store.save();
        set({ ollamaUrl: url });
    },

    setDefaultModel: async (model: string) => {
        const store = await load("settings.json", { autoSave: false, defaults: {} });
        await store.set("defaultModel", model);
        await store.save();
        set({ defaultModel: model });
    },

    loadSettings: async () => {
        if (get().isLoaded) return;
        try {
            const store = await load("settings.json", { autoSave: false, defaults: {} });
            const openAiKey = await store.get<string>("openAiKey") || "";
            const claudeKey = await store.get<string>("claudeKey") || "";
            const geminiKey = await store.get<string>("geminiKey") || "";
            const ollamaUrl = await store.get<string>("ollamaUrl") || "http://localhost:11434";
            const defaultModel = await store.get<string>("defaultModel") || "gpt-4o";
            set({ openAiKey, claudeKey, geminiKey, ollamaUrl, defaultModel, isLoaded: true });
        } catch (error) {
            console.error("Failed to load settings store:", error);
        }
    }
}));
