import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

interface BuilderState {
    goal: string;
    context: string;
    selectedPersonaId: string;
    constraints: string;
    outputFormat: string;
    isLoaded: boolean;
    setGoal: (goal: string) => void;
    setContext: (context: string) => void;
    setSelectedPersonaId: (id: string) => void;
    setConstraints: (constraints: string) => void;
    setOutputFormat: (format: string) => void;
    loadBuilderState: () => Promise<void>;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
    goal: "",
    context: "",
    selectedPersonaId: "",
    constraints: "",
    outputFormat: "",
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

    loadBuilderState: async () => {
        if (get().isLoaded) return;
        try {
            const store = await load("builder.json", { autoSave: false, defaults: {} });
            const goal = await store.get<string>("goal") || "";
            const context = await store.get<string>("context") || "";
            const selectedPersonaId = await store.get<string>("selectedPersonaId") || "";
            const constraints = await store.get<string>("constraints") || "";
            const outputFormat = await store.get<string>("outputFormat") || "";

            set({
                goal,
                context,
                selectedPersonaId,
                constraints,
                outputFormat,
                isLoaded: true
            });
        } catch (error) {
            console.error("Failed to load builder state:", error);
        }
    }
}));
