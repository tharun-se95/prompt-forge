import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "../lib/tauri";



export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface SchemaField {
    id: string;
    key: string;
    type: SchemaFieldType;
    description: string;
}

export interface OutputFormat {
    mode: 'simple' | 'structured';
    raw: string;
    schema: SchemaField[];
}

interface BuilderState {
    goal: string;
    context: string;
    selectedPersonaId: string;
    constraints: string;
    outputFormat: OutputFormat;
    blockOrder: string[];
    lastResult: string;
    isLoaded: boolean;
    setGoal: (goal: string) => void;
    setContext: (context: string) => void;
    appendContext: (content: string) => void;
    setSelectedPersonaId: (id: string) => void;
    setConstraints: (constraints: string) => void;
    setOutputFormat: (format: OutputFormat) => void;
    setBlockOrder: (order: string[]) => void;
    setLastResult: (result: string) => void;
    loadBuilderState: () => Promise<void>;
}

export const DEFAULT_BLOCK_ORDER = ["goal", "context", "constraints", "outputFormat"];

export const useBuilderStore = create<BuilderState>((set, get) => ({
    goal: "",
    context: "",
    selectedPersonaId: "",
    constraints: "",
    outputFormat: { mode: 'simple', raw: '', schema: [] },
    blockOrder: DEFAULT_BLOCK_ORDER,
    lastResult: "",
    isLoaded: false,

    setGoal: async (goal) => {
        set({ goal });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("goal", goal);
            await store.save();
        }
    },


    setContext: async (context) => {
        set({ context });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("context", context);
            await store.save();
        }
    },


    appendContext: async (content) => {
        const current = get().context;
        const newContext = current ? current + "\n\n" + content : content;
        set({ context: newContext });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("context", newContext);
            await store.save();
        }
    },


    setSelectedPersonaId: async (selectedPersonaId) => {
        set({ selectedPersonaId });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("selectedPersonaId", selectedPersonaId);
            await store.save();
        }
    },


    setConstraints: async (constraints) => {
        set({ constraints });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("constraints", constraints);
            await store.save();
        }
    },


    setOutputFormat: async (outputFormat) => {
        set({ outputFormat });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("outputFormat", outputFormat);
            await store.save();
        }
    },

    setBlockOrder: async (blockOrder) => {
        set({ blockOrder });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("blockOrder", blockOrder);
            await store.save();
        }
    },

    setLastResult: async (lastResult) => {
        set({ lastResult });
        if (isTauri()) {
            const store = await load("builder.json", { autoSave: false });
            await store.set("lastResult", lastResult);
            await store.save();
        }
    },


    loadBuilderState: async () => {
        if (get().isLoaded) return;

        if (!isTauri()) {
            set({ isLoaded: true });
            return;
        }

        try {
            const store = await load("builder.json", { autoSave: false });
            const [goal, context, selectedPersonaId, constraints, outputFormat, blockOrder, lastResult] = await Promise.all([
                store.get<string>("goal"),
                store.get<string>("context"),
                store.get<string>("selectedPersonaId"),
                store.get<string>("constraints"),
                store.get<OutputFormat>("outputFormat"),
                store.get<string[]>("blockOrder"),
                store.get<string>("lastResult")
            ]);

            set({
                goal: goal || "",
                context: context || "",
                selectedPersonaId: selectedPersonaId || "",
                constraints: constraints || "",
                outputFormat: outputFormat || { mode: 'simple', raw: '', schema: [] },
                blockOrder: blockOrder && blockOrder.length > 0 ? blockOrder : DEFAULT_BLOCK_ORDER,
                lastResult: lastResult || "",
                isLoaded: true
            });
        } catch (error) {
            console.error("Failed to load builder state:", error);
            set({ isLoaded: true });
        }
    }

}));
