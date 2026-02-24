import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";

export function AppLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full h-screen overflow-hidden bg-background text-foreground flex flex-col">
                <header className="flex h-14 items-center border-b px-4 lg:h-[60px] shrink-0">
                    <SidebarTrigger />
                </header>
                <div className="flex-1 overflow-auto bg-muted/20">
                    <Outlet />
                </div>
            </main>
        </SidebarProvider>
    );
}
