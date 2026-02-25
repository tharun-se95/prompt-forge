import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { usePersonasStore } from "@/store/personas";
import { useSettingsStore } from "@/store/settings";
import { useBuilderStore } from "@/store/builder";
import { useHistoryStore } from "@/store/history";
import { DebugConsole } from "@/components/debug/DebugConsole";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { useClipboardStore } from "@/store/clipboard";
import { Toaster } from "@/components/ui/sonner";
import { isTauri } from "@/lib/tauri";


export function AppLayout() {
    const { loadPersonas } = usePersonasStore();
    const { loadSettings } = useSettingsStore();
    const { loadBuilderState } = useBuilderStore();
    const { loadHistory } = useHistoryStore();

    const { addHistoryItem } = useClipboardStore();

    useEffect(() => {
        // Load all stores in parallel at the root level
        Promise.all([
            loadPersonas(),
            loadSettings(),
            loadBuilderState(),
            loadHistory()
        ]);

        // Background clipboard polling
        const interval = setInterval(async () => {
            if (!isTauri()) return;
            try {
                const text = await readText();
                if (text) {
                    addHistoryItem(text);
                }
            } catch (e) {
                // Ignore errors during background polling
            }
        }, 1000);


        return () => clearInterval(interval);
    }, [loadPersonas, loadSettings, loadBuilderState, loadHistory, addHistoryItem]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
                <header className="h-16 md:h-20 border-b border-white/5 flex items-center px-6 md:px-10 shrink-0 bg-background/40 backdrop-blur-2xl sticky top-0 z-[50]">
                    <div className="flex items-center gap-6">
                        <SidebarTrigger className="hover:bg-white/5 rounded-xl h-10 w-10" />
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-[2px] bg-indigo-500/40 rounded-full hidden md:block" />
                            <span className="font-outfit font-black text-2xl tracking-tighter bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">PromptForge</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
            <DebugConsole />
            <Toaster />
        </SidebarProvider>
    );
}
