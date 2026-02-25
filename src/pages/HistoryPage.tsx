import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistoryStore, HistoryEntry } from "@/store/history";
import { useBuilderStore } from "@/store/builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Cpu, RotateCcw, ChevronRight, History as HistoryIcon, FileText, Copy, Trash2, LayoutList, Calendar, ShieldCheck } from "lucide-react";
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

        let parsedOutputFormat;
        try {
            const parsed = JSON.parse(entry.outputFormat);
            if (Array.isArray(parsed)) {
                parsedOutputFormat = { mode: 'structured' as const, raw: '', schema: parsed };
            } else {
                parsedOutputFormat = { mode: 'simple' as const, raw: entry.outputFormat, schema: [] };
            }
        } catch {
            parsedOutputFormat = { mode: 'simple' as const, raw: entry.outputFormat || '', schema: [] };
        }
        setOutputFormat(parsedOutputFormat);

        setLastResult(entry.response);
        toast.success("Prompt restored to Builder");
        navigate("/");
    };

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden bg-background selection:bg-indigo-500/10">
            {/* Master Sidebar (Glassmorphic) */}
            <div className="w-full md:w-[360px] 2xl:w-[420px] border-r border-white/5 flex flex-col shrink-0 bg-card/20 backdrop-blur-xl relative z-20 shadow-2xl">
                <div className="p-8 border-b border-white/5 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <LayoutList className="size-5 text-indigo-400" />
                            </div>
                            <h3 className="font-outfit font-black text-xl tracking-tight uppercase">Archive</h3>
                        </div>
                        {history.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => {
                                    if (confirm("Clear all history? This cannot be undone.")) {
                                        clearHistory();
                                    }
                                }}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        <HistoryIcon className="size-3" />
                        <span>{history.length} Cognitive Cycles Recorded</span>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center px-8 opacity-20">
                                <HistoryIcon className="size-16 mb-4" />
                                <p className="text-base font-bold font-outfit uppercase tracking-widest">History Empty</p>
                                <p className="text-xs mt-2 italic leading-relaxed">Generated artifacts will be archived here automatically.</p>
                            </div>
                        ) : (
                            history.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => setSelectedId(entry.id!)}
                                    className={cn(
                                        "w-full text-left p-5 rounded-[1.5rem] transition-all duration-300 flex flex-col gap-3 group relative border",
                                        selectedId === entry.id || (!selectedId && history[0].id === entry.id)
                                            ? "bg-white/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5 ring-1 ring-white/10"
                                            : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                                    )}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2 opacity-50 font-mono text-[9px] font-bold uppercase tracking-tight">
                                            <Calendar className="size-2.5" />
                                            {new Date(entry.timestamp).toLocaleDateString()}
                                            <span className="opacity-30">/</span>
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <ChevronRight className={cn("size-3 transition-all duration-300", selectedId === entry.id ? "translate-x-0 opacity-100 text-indigo-400" : "-translate-x-2 opacity-0")} />
                                    </div>
                                    <p className="text-sm font-bold font-outfit tracking-tight line-clamp-2 leading-snug pr-4">
                                        {entry.goal || "Abstract Workflow"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase tracking-widest px-2 border-indigo-500/20 bg-indigo-500/5 text-indigo-400">
                                            {entry.personaName}
                                        </Badge>
                                        <Badge variant="outline" className="text-[8px] h-4 font-mono opacity-40 px-0">
                                            {entry.model}
                                        </Badge>
                                    </div>
                                    {(selectedId === entry.id || (!selectedId && history[0].id === entry.id)) && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full blur-sm" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail Pane (Adaptive Expansion) */}
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
                {!selectedEntry ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                        <div className="size-32 rounded-full bg-indigo-500/5 flex items-center justify-center mb-10 relative">
                            <HistoryIcon className="size-12 text-indigo-400/20" />
                            <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping" />
                        </div>
                        <h2 className="text-3xl font-black font-outfit tracking-tight opacity-20 uppercase">Archive Module Offline</h2>
                        <p className="max-w-xs mt-3 text-xs text-muted-foreground/40 leading-relaxed font-medium uppercase tracking-widest">
                            Syncing with persistent history nodes. Select a cycle to reveal logic.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="p-8 md:p-12 2xl:p-16 border-b border-white/5 bg-card/10 backdrop-blur-md shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <HistoryIcon className="size-64 -mr-32 -mt-32 rotate-12" />
                            </div>

                            <div className="relative z-10 space-y-4 max-w-4xl">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                        <User className="size-3.5 text-indigo-400" />
                                        <span className="font-outfit font-black text-[10px] uppercase tracking-[0.2em] text-indigo-400">{selectedEntry.personaName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                        <Cpu className="size-3.5 text-muted-foreground/60" />
                                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{selectedEntry.model}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                                        <Clock className="size-3.5 text-muted-foreground/60" />
                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                            {new Date(selectedEntry.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                </div>
                                <h2 className="text-4xl 2xl:text-5xl font-black font-outfit tracking-tight leading-[1.1]">{selectedEntry.goal || "Artifact Without Objective"}</h2>
                            </div>

                            <div className="relative z-10 flex shrink-0">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 font-black font-outfit uppercase tracking-widest gap-3 premium-gradient shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] active:scale-[0.97] transition-all rounded-2xl group"
                                    onClick={() => handleRestore(selectedEntry)}
                                >
                                    <RotateCcw className="size-5 group-hover:-rotate-45 transition-transform duration-300" />
                                    Restore Logic
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-8 md:p-12 2xl:p-16 max-w-7xl mx-auto space-y-12 3xl:space-y-16 pb-32">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 3xl:gap-12">
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-indigo-500/30 rounded-full" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Logic Context</h3>
                                        </div>
                                        <div className="bg-card/30 border border-white/5 p-8 rounded-[2rem] shadow-sm relative group/inner">
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <FileText className="size-12" />
                                            </div>
                                            <p className="text-sm font-medium leading-relaxed italic text-foreground/80 selection:bg-indigo-500/30">
                                                {selectedEntry.context || "No context injection detected for this cycle."}
                                            </p>
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-indigo-500/30 rounded-full" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Operational Directives</h3>
                                        </div>
                                        <div className="bg-card/30 border border-white/5 p-8 rounded-[2rem] shadow-sm relative group/inner">
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <ShieldCheck className="size-12" />
                                            </div>
                                            <div className="space-y-3">
                                                {selectedEntry.constraints ? selectedEntry.constraints.split("\n").map((c, i) => (
                                                    <div key={i} className="flex gap-4 group/item">
                                                        <div className="size-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 opacity-40 group-hover/item:opacity-100 transition-opacity" />
                                                        <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors leading-relaxed">{c}</span>
                                                    </div>
                                                )) : (
                                                    <p className="text-xs italic opacity-30">No constraints mapped.</p>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-1 bg-emerald-500/30 rounded-full" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400/80">Artifact Synthesis</h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 px-4 rounded-xl gap-2 font-bold uppercase tracking-widest text-[10px] bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-500/20"
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedEntry.response);
                                                toast.success("Artifact copied to clipboard");
                                            }}
                                        >
                                            <Copy className="size-3.5" />
                                            Sync to Clipboard
                                        </Button>
                                    </div>
                                    <div className="bg-card/40 border border-white/5 p-10 2xl:p-14 rounded-[3rem] shadow-2xl relative group/synth min-h-[400px]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-emerald-500/[0.02] pointer-events-none" />
                                        <div className="relative z-10 font-sans text-lg 2xl:text-xl leading-[1.8] text-foreground/90 whitespace-pre-wrap selection:bg-indigo-500/20 scroll-smooth">
                                            {selectedEntry.response}
                                        </div>
                                    </div>
                                </section>

                                <div className="flex items-center justify-center pt-8 opacity-20 hover:opacity-100 transition-opacity duration-700">
                                    <div className="flex items-center gap-4 px-6 py-2 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] font-outfit">
                                        End of Artifact Trace
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </>
                )}
            </div>
        </div>
    );
}
