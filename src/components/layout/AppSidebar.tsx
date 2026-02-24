import { Link, useLocation } from "react-router-dom";
import { Copy, History, Settings, UserCircle, Wand2 } from "lucide-react";
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
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex items-center gap-2 px-4 py-4 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Wand2 className="size-5" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">PromptForge</span>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
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
