import { useDebugStore } from "@/store/debug";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, X, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function DebugConsole() {
    const { logs, clearLogs } = useDebugStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <Button
                variant="default"
                size="sm"
                className="fixed bottom-4 right-4 rounded-full shadow-2xl z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border-2 border-white/20"
                onClick={() => setIsOpen(true)}
            >
                <Terminal className="size-4" />
                <span className="text-xs font-bold tracking-tight">DEBUG CONSOLE</span>
            </Button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-[450px] h-[500px] bg-card border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2 font-semibold">
                    <Terminal className="size-4" />
                    <span>Debug Console</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearLogs}>
                        <Trash2 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                        <X className="size-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                    {logs.length === 0 ? (
                        <p className="text-center text-muted-foreground text-xs py-10">No logs yet...</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="text-[11px] border-b pb-2 last:border-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {log.level === "error" && <AlertCircle className="size-3 text-destructive" />}
                                    {log.level === "warn" && <AlertTriangle className="size-3 text-yellow-500" />}
                                    {log.level === "info" && <Info className="size-3 text-blue-500" />}
                                    <span className="font-bold uppercase tracking-wider text-[9px] opacity-70">
                                        {log.level}
                                    </span>
                                    <span className="text-muted-foreground ml-auto">{log.timestamp}</span>
                                </div>
                                <p className="font-mono break-all leading-relaxed">{log.message}</p>
                                {log.data && (
                                    <pre className="mt-1 p-1 bg-muted/50 rounded overflow-x-auto text-[10px]">
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
