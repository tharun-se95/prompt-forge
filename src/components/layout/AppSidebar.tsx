import { Link, useLocation } from "react-router-dom";
import { Copy, History, Settings, UserCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
    { title: "Builder", url: "/", icon: Wand2 },
    { title: "Personas", url: "/personas", icon: UserCircle },
    { title: "History", url: "/history", icon: History },
    { title: "Clipboard", url: "/clipboard", icon: Copy },
    { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
    const location = useLocation();

    return (
        <Sidebar className="border-r border-white/5 bg-background/40 backdrop-blur-2xl">
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex items-center gap-3 px-4 py-6 mb-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                            <Wand2 className="size-5" />
                        </div>
                        <span className="font-outfit font-bold text-xl tracking-tight">PromptForge</span>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.url} className="h-10 transition-all duration-200 hover:bg-white/5 active:scale-[0.98]">
                                        <Link to={item.url} className="flex items-center gap-3">
                                            <item.icon className={cn("size-4 transition-colors", location.pathname === item.url ? "text-indigo-400" : "text-muted-foreground")} />
                                            <span className={cn("font-medium", location.pathname === item.url ? "text-foreground" : "text-muted-foreground")}>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
