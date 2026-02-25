import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "../lib/tauri";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

import { OutputFormat } from "./builder";

export interface BranchStateSnapshot {
    goal: string;
    context: string;
    selectedPersonaId: string;
    constraints: string;
    outputFormat: OutputFormat;
}

export interface Branch {
    id: string;
    name: string;
    createdAt: string;
    lastModified: string;
    state: BranchStateSnapshot;
}

interface BranchStoreState {
    branches: Branch[];
    activeBranchId: string | null;
    isLoaded: boolean;
    loadBranches: () => Promise<void>;
    createBranch: (name: string, currentState: BranchStateSnapshot) => Promise<string>;
    updateBranch: (id: string, name: string) => Promise<void>;
    deleteBranch: (id: string) => Promise<void>;
    setActiveBranchId: (id: string | null) => Promise<void>;
}

export const useBranchStore = create<BranchStoreState>((set, get) => ({
    branches: [],
    activeBranchId: null,
    isLoaded: false,

    loadBranches: async () => {
        if (get().isLoaded) return;
        if (!isTauri()) {
            set({ isLoaded: true });
            return;
        }

        try {
            const store = await load("branches.json", { autoSave: false, defaults: {} });
            const branches = await store.get<Branch[]>("branches") || [];
            const activeBranchId = await store.get<string | null>("activeBranchId") || null;

            set({ branches, activeBranchId, isLoaded: true });
        } catch (error) {
            console.error("Failed to load branches:", error);
            set({ isLoaded: true });
            toast.error("Failed to load prompt versions.");
        }
    },

    createBranch: async (name, currentState) => {
        const id = uuidv4();
        const newBranch: Branch = {
            id,
            name,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            state: { ...currentState } // Deepish copy
        };

        const currentBranches = get().branches;
        const newBranches = [...currentBranches, newBranch];

        set({ branches: newBranches, activeBranchId: id });

        if (isTauri()) {
            try {
                const store = await load("branches.json", { autoSave: false, defaults: {} });
                await store.set("branches", newBranches);
                await store.set("activeBranchId", id);
                await store.save();
            } catch (error) {
                console.error("Failed to save branch to store:", error);
            }
        }

        toast.success(`Created branch "${name}"`);
        return id;
    },

    updateBranch: async (id, name) => {
        const currentBranches = get().branches;
        const newBranches = currentBranches.map(b =>
            b.id === id ? { ...b, name, lastModified: new Date().toISOString() } : b
        );

        set({ branches: newBranches });

        if (isTauri()) {
            try {
                const store = await load("branches.json", { autoSave: false, defaults: {} });
                await store.set("branches", newBranches);
                await store.save();
            } catch (error) {
                console.error("Failed to update branch in store:", error);
            }
        }
    },

    deleteBranch: async (id) => {
        const currentBranches = get().branches;
        const activeBranchId = get().activeBranchId;
        const newBranches = currentBranches.filter(b => b.id !== id);

        let newActiveId = activeBranchId;
        if (activeBranchId === id) {
            // If deleting active branch, set active to null or latest
            newActiveId = newBranches.length > 0 ? newBranches[newBranches.length - 1].id : null;
        }

        set({ branches: newBranches, activeBranchId: newActiveId });

        if (isTauri()) {
            try {
                const store = await load("branches.json", { autoSave: false, defaults: {} });
                await store.set("branches", newBranches);
                await store.set("activeBranchId", newActiveId);
                await store.save();
            } catch (error) {
                console.error("Failed to delete branch in store:", error);
            }
        }

        toast.success("Branch deleted");
    },

    setActiveBranchId: async (id) => {
        set({ activeBranchId: id });
        if (isTauri()) {
            try {
                const store = await load("branches.json", { autoSave: false, defaults: {} });
                await store.set("activeBranchId", id);
                await store.save();
            } catch (e) {
                console.error(e);
            }
        }
    }
}));
