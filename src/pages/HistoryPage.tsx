import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistoryStore, HistoryEntry } from "@/store/history";
import { useBuilderStore } from "@/store/builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Cpu, RotateCcw, ChevronRight, History as HistoryIcon, FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function HistoryPage() {
    const navigate = useNavigate();
    const { history, loadHistory, clearHistory } = useHistoryStore();
    const {
        setGoal, setContext, setSelectedPersonaId,
        setConstraints, setOutputFormat, setLastResult
    } = useBuilderStore();

    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Default to the most recent entry
    const selectedEntry = history.find(e => e.id === selectedId) || (history.length > 0 ? history[0] : null);

    useEffect(() => {
        if (!selectedId && history.length > 0) {
            setSelectedId(history[0].id!);
        }
    }, [history, selectedId]);

    const handleRestore = (entry: HistoryEntry) => {
        setGoal(entry.goal);
        setContext(entry.context);
        setSelectedPersonaId(entry.personaId);
        setConstraints(entry.constraints);
        setOutputFormat(entry.outputFormat);
        setLastResult(entry.response);
        toast.success("Prompt restored to Builder");
        navigate("/");
    };

    return (
        <div className="h-full flex overflow-hidden bg-background">
            {/* Master Sidebar */}
            <div className="w-[320px] border-r flex flex-col shrink-0 bg-muted/5">
                <div className="p-4 border-b shrink-0 flex items-center justify-between bg-card/50">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <HistoryIcon className="size-4 text-primary" />
                        Prompt History ({history.length})
                    </h3>
                    {history.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                if (confirm("Clear all history? This cannot be undone.")) {
                                    clearHistory();
                                }
                            }}
                        >
                            <Clock className="size-4" />
                        </Button>
                    )}
                </div>

                <ScrollArea className="flex-1">
                    <div className="divide-y divide-border/30">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 px-6">
                                <HistoryIcon className="size-12 mb-4" />
                                <p className="text-sm font-medium">No history yet</p>
                                <p className="text-xs mt-1 italic">Saved prompts will appear here automatically.</p>
                            </div>
                        ) : (
                            history.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => setSelectedId(entry.id!)}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-muted/50 transition-all flex flex-col gap-2 relative group",
                                        selectedId === entry.id || (!selectedId && history[0].id === entry.id)
                                            ? "bg-muted/80 border-r-4 border-primary shadow-sm"
                                            : ""
                                    )}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[10px] font-mono opacity-60 font-bold tracking-tighter uppercase">
                                            {new Date(entry.timestamp).toLocaleDateString()} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <ChevronRight className={cn("size-3.5 opacity-0 transition-opacity", selectedId === entry.id && "opacity-40")} />
                                    </div>
                                    <p className="text-xs font-semibold truncate leading-tight">
                                        {entry.goal || "Untitled Workflow"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[9px] h-4 font-mono px-1 border-primary/20 bg-primary/5">
                                            {entry.personaName}
                                        </Badge>
                                        <span className="text-[9px] text-muted-foreground font-mono opacity-60">
                                            {entry.model}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail Pane */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedEntry ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-20">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-8">
                            <HistoryIcon className="size-10" />
                        </div>
                        <h2 className="text-2xl font-bold">Select an entry</h2>
                        <p className="max-w-xs mt-2 text-sm">Review the full details of your past cognitive cycles.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-8 border-b bg-card shrink-0 flex items-center justify-between shadow-sm z-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <HistoryIcon className="size-32 -mr-16 -mt-16" />
                            </div>

                            <div className="relative z-10 space-y-2">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                                        <User className="size-3" /> {selectedEntry.personaName}
                                    </Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
                                        <Cpu className="size-3" /> {selectedEntry.model}
                                    </Badge>
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">{selectedEntry.goal || "No Goal Specified"}</h2>
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Clock className="size-3.5" />
                                    Completed on {new Date(selectedEntry.timestamp).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                                </p>
                            </div>

                            <div className="relative z-10">
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
                                    onClick={() => handleRestore(selectedEntry)}
                                >
                                    <RotateCcw className="size-4" />
                                    Restore to Builder
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-muted/10">
                            <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <FileText className="size-4 text-muted-foreground" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Prompt Context</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1 bg-card p-4 rounded-xl border shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase">Core Context</span>
                                            <p className="text-xs italic leading-relaxed">{selectedEntry.context || "No context provided"}</p>
                                        </div>
                                        <div className="space-y-1 bg-card p-4 rounded-xl border shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase">Constraints</span>
                                            <p className="text-xs italic leading-relaxed">{selectedEntry.constraints || "No constraints provided"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-card p-6 rounded-xl border shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Compiled Prompt</span>
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => navigator.clipboard.writeText(selectedEntry.prompt)}>
                                                Copy Prompt
                                            </Button>
                                        </div>
                                        <pre className="text-xs font-mono bg-muted/30 p-4 rounded-lg border leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                            {selectedEntry.prompt}
                                        </pre>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <MessageSquare className="size-4 text-primary" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">AI Generation Result</h3>
                                    </div>
                                    <div className="bg-card p-8 rounded-2xl border-2 border-primary/5 shadow-xl relative group">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => navigator.clipboard.writeText(selectedEntry.response)}>
                                                Copy Response
                                            </Button>
                                        </div>
                                        <div className="text-[15px] font-serif leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
                                            {selectedEntry.response}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </>
                )}
            </div>
        </div>
    );
}
