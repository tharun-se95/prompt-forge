import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

interface BuilderState {
    goal: string;
    context: string;
    selectedPersonaId: string;
    constraints: string;
    outputFormat: string;
    lastResult: string;
    isLoaded: boolean;
    setGoal: (goal: string) => void;
    setContext: (context: string) => void;
    appendContext: (content: string) => void;
    setSelectedPersonaId: (id: string) => void;
    setConstraints: (constraints: string) => void;
    setOutputFormat: (format: string) => void;
    setLastResult: (result: string) => void;
    loadBuilderState: () => Promise<void>;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
    goal: "",
    context: "",
    selectedPersonaId: "",
    constraints: "",
    outputFormat: "",
    lastResult: "",
    isLoaded: false,

    setGoal: async (goal) => {
        set({ goal });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("goal", goal);
        await store.save();
    },

    setContext: async (context) => {
        set({ context });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("context", context);
        await store.save();
    },

    appendContext: async (content) => {
        const current = get().context;
        const newContext = current ? current + "\n\n" + content : content;
        set({ context: newContext });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("context", newContext);
        await store.save();
    },

    setSelectedPersonaId: async (selectedPersonaId) => {
        set({ selectedPersonaId });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("selectedPersonaId", selectedPersonaId);
        await store.save();
    },

    setConstraints: async (constraints) => {
        set({ constraints });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("constraints", constraints);
        await store.save();
    },

    setOutputFormat: async (outputFormat) => {
        set({ outputFormat });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("outputFormat", outputFormat);
        await store.save();
    },

    setLastResult: async (lastResult) => {
        set({ lastResult });
        const store = await load("builder.json", { autoSave: false, defaults: {} });
        await store.set("lastResult", lastResult);
        await store.save();
    },

    loadBuilderState: async () => {
        if (get().isLoaded) return;
        try {
            const store = await load("builder.json", { autoSave: false, defaults: {} });
            const [goal, context, selectedPersonaId, constraints, outputFormat, lastResult] = await Promise.all([
                store.get<string>("goal"),
                store.get<string>("context"),
                store.get<string>("selectedPersonaId"),
                store.get<string>("constraints"),
                store.get<string>("outputFormat"),
                store.get<string>("lastResult")
            ]);

            set({
                goal: goal || "",
                context: context || "",
                selectedPersonaId: selectedPersonaId || "",
                constraints: constraints || "",
                outputFormat: outputFormat || "",
                lastResult: lastResult || "",
                isLoaded: true
            });
        } catch (error) {
            console.error("Failed to load builder state:", error);
        }
    }
}));
