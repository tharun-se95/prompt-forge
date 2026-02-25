import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { Persona, defaultPersonas } from "../lib/roles";
import { isTauri } from "../lib/tauri";


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

        if (isTauri()) {
            try {
                const store = await load("personas.json", { autoSave: false });
                await store.set("customPersonas", newPersonas.filter(p => p.isCustom));
                await store.save();
            } catch (e) {
                console.error("Failed to save persona to Tauri store:", e);
            }
        }

        set({ personas: newPersonas });
    },


    updatePersona: async (id, updated) => {
        const newPersonas = get().personas.map(p => p.id === id ? { ...updated, isCustom: p.isCustom } : p);

        if (isTauri()) {
            try {
                const store = await load("personas.json", { autoSave: false });
                await store.set("customPersonas", newPersonas.filter(p => p.isCustom));
                await store.save();
            } catch (e) {
                console.error("Failed to update persona in Tauri store:", e);
            }
        }

        set({ personas: newPersonas });
    },


    deletePersona: async (id) => {
        const newPersonas = get().personas.filter(p => p.id !== id || !p.isCustom);

        if (isTauri()) {
            try {
                const store = await load("personas.json", { autoSave: false });
                await store.set("customPersonas", newPersonas.filter(p => p.isCustom));
                await store.save();
            } catch (e) {
                console.error("Failed to delete persona from Tauri store:", e);
            }
        }

        set({ personas: newPersonas });
    },


    loadPersonas: async () => {
        if (get().isLoaded) return;

        if (!isTauri()) {
            set({ isLoaded: true });
            return;
        }

        try {
            const store = await load("personas.json", { autoSave: false });
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
            set({ isLoaded: true }); // Mark as loaded even if it fails to prevent infinite retries
        }
    }

}));
