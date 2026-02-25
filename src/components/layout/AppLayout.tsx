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
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-14 border-b flex items-center px-6 shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                    <SidebarTrigger />
                    <div className="ml-4 flex items-center gap-2">
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">PromptForge</span>
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
