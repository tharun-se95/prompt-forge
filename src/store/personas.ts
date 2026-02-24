import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { Persona, defaultPersonas } from "../lib/roles";

interface PersonasState {
    personas: Persona[];
    isLoaded: boolean;
    addPersona: (persona: Persona) => Promise<void>;
    updatePersona: (id: string, updated: Persona) => Promise<void>;
    deletePersona: (id: string) => Promise<void>;
    loadPersonas: () => Promise<void>;
}

export const usePersonasStore = create<PersonasState>((set, get) => ({
    personas: defaultPersonas,
    isLoaded: false,

    addPersona: async (persona) => {
        const newPersonas = [...get().personas, { ...persona, isCustom: true }];
        const store = await load("personas.json", { autoSave: false, defaults: {} });
        await store.set("customPersonas", newPersonas.filter(p => p.isCustom));
        await store.save();
        set({ personas: newPersonas });
    },

    updatePersona: async (id, updated) => {
        const newPersonas = get().personas.map(p => p.id === id ? { ...updated, isCustom: p.isCustom } : p);
        const store = await load("personas.json", { autoSave: false, defaults: {} });
        await store.set("customPersonas", newPersonas.filter(p => p.isCustom));
        await store.save();
        set({ personas: newPersonas });
    },

    deletePersona: async (id) => {
        const newPersonas = get().personas.filter(p => p.id !== id || !p.isCustom);
        const store = await load("personas.json", { autoSave: false, defaults: {} });
        await store.set("customPersonas", newPersonas.filter(p => p.isCustom));
        await store.save();
        set({ personas: newPersonas });
    },

    loadPersonas: async () => {
        if (get().isLoaded) return;
        try {
            const store = await load("personas.json", { autoSave: false, defaults: {} });
            const customPersonas = await store.get<Persona[]>("customPersonas") || [];

            const allPersonas = [...defaultPersonas];

            for (const custom of customPersonas) {
                const index = allPersonas.findIndex(p => p.id === custom.id);
                if (index >= 0) {
                    allPersonas[index] = custom;
                } else {
                    allPersonas.push(custom);
                }
            }

            set({ personas: allPersonas, isLoaded: true });
        } catch (e) {
            console.error("Failed to load personas:", e);
        }
    }
}));
