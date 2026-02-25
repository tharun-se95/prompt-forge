import { useClipboardStore } from "@/store/clipboard";
import { Button } from "@/components/ui/button";
import { Copy as CopyIcon, Trash2, Zap, Send, Code, ChevronRight, History, Layers, X, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBuilderStore } from "@/store/builder";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { detectContentType } from "@/lib/utils/classifier";
import { assembleContext } from "@/lib/utils/assembly";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from "sonner";

export function ClipboardPage() {
    const { history, clearHistory, removeHistoryItem, selectedIds, toggleSelection, clearSelection } = useClipboardStore();
    const { setContext } = useBuilderStore();
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedItem = history.find(item => item.id === selectedId) || (history.length > 0 ? history[0] : null);

    const classification = useMemo(() => {
        if (!selectedItem) return { type: 'text' as const };
        return detectContentType(selectedItem.content);
    }, [selectedItem]);

    useEffect(() => {
        if (!selectedId && history.length > 0) {
            setSelectedId(history[0].id);
        }
    }, [history, selectedId]);

    const handleSendToBuilder = (content: string) => {
        setContext(content);
        toast.success("Context set in Builder");
        navigate("/");
    };

    const handleAssemble = () => {
        const selectedItems = history.filter(item => selectedIds.includes(item.id));
        const assembled = assembleContext(selectedItems);
        setContext(assembled);
        clearSelection();
        toast.success(`Assembled ${selectedItems.length} items to Builder`);
        navigate("/");
    };

    return (
        <div className="h-full flex overflow-hidden bg-background relative">
            {/* Master Sidebar - History List */}
            <div className="w-[320px] border-r flex flex-col shrink-0 bg-muted/10">
                <div className="p-4 border-b shrink-0 flex items-center justify-between bg-card/50">
                    <div className="flex items-center gap-2">
                        <History className="size-4 text-primary" />
                        <h3 className="font-semibold text-sm">History ({history.length})</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {selectedIds.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={clearSelection}>
                                <X className="size-3.5" />
                            </Button>
                        )}
                        {history.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={clearHistory}>
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="divide-y divide-border/40">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 px-4">
                                <CopyIcon className="size-10 mb-2" />
                                <p className="text-xs">Clipboard history is empty</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "w-full flex items-center group transition-all",
                                        selectedId === item.id ? "bg-muted/80 border-r-2 border-primary" : "hover:bg-muted/50"
                                    )}
                                >
                                    <div className="pl-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                            className="size-3.5 rounded border-muted-foreground/30 accent-primary cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setSelectedId(item.id)}
                                        className="flex-1 text-left p-3 flex flex-col gap-1 overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-[9px] font-mono opacity-60 uppercase tracking-tighter">
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <ChevronRight className={cn("size-3 opacity-0 group-hover:opacity-40", selectedId === item.id && "opacity-40")} />
                                        </div>
                                        <p className="text-xs font-mono truncate opacity-90 leading-relaxed">
                                            {item.content.trim().split('\n')[0] || "Empty content"}
                                        </p>
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 mr-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeHistoryItem(item.id);
                                        }}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Detail Pane - Preview & Actions */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedItem ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-30">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                            <CopyIcon className="size-8" />
                        </div>
                        <h2 className="text-xl font-bold">No Item Selected</h2>
                        <p className="max-w-xs mt-2 text-sm italic">Capture something from your system clipboard to begin cognitive analysis.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b bg-card shrink-0 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    {classification.type === 'code' ? <Code className="size-5" /> :
                                        classification.type === 'log' ? <Layers className="size-5" /> :
                                            <Sparkles className="size-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                                        Intelligence Preview
                                        <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                                            {classification.detail || classification.type}
                                        </span>
                                    </h2>
                                    <p className="text-muted-foreground text-xs flex items-center gap-2 mt-0.5">
                                        Captured {new Date(selectedItem.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex bg-muted rounded-lg p-0.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-semibold rounded-md hover:bg-background"
                                        onClick={() => handleSendToBuilder(selectedItem.content)}
                                    >
                                        <Send className="size-3.5 mr-2" />
                                        Replace
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-semibold rounded-md hover:bg-background text-primary"
                                        onClick={() => {
                                            const { appendContext } = useBuilderStore.getState();
                                            appendContext(selectedItem.content);
                                            toast.success("Appended to Builder context");
                                            navigate("/");
                                        }}
                                    >
                                        <Layers className="size-3.5 mr-2" />
                                        Append
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-9 px-4"
                                    onClick={() => {
                                        setContext(selectedItem.content);
                                        navigate("/?action=explain");
                                    }}
                                >
                                    <Zap className="size-4 mr-2 text-blue-500" />
                                    Explain
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                            <div className="flex-1 bg-card border rounded-xl shadow-inner relative flex flex-col overflow-hidden">
                                <div className="p-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">RAW CONTENT</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] uppercase font-bold"
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedItem.content);
                                        }}
                                    >
                                        Copy Raw
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1">
                                    {classification.type === 'code' || classification.type === 'json' || classification.type === 'sql' ? (
                                        <SyntaxHighlighter
                                            language={classification.detail || classification.type}
                                            style={vscDarkPlus}
                                            customStyle={{
                                                margin: 0,
                                                padding: '1.5rem',
                                                fontSize: '0.85rem',
                                                lineHeight: '1.5',
                                                background: 'transparent',
                                                fontFamily: 'var(--font-mono)'
                                            }}
                                            wrapLongLines
                                        >
                                            {selectedItem.content}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <pre className="p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                                            {selectedItem.content}
                                        </pre>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Assembly Workbench Bar */}
            {selectedIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-2xl shadow-primary/40 flex items-center gap-6 border border-white/10 ring-4 ring-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="size-6 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                                {selectedIds.length}
                            </div>
                            <span className="text-sm font-bold tracking-tight">Items selected for assembly</span>
                        </div>
                        <div className="h-6 w-px bg-white/20" />
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 font-bold text-xs px-4"
                                onClick={handleAssemble}
                            >
                                <Sparkles className="size-3.5 mr-2" />
                                Assemble & Send
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 font-bold text-xs px-2 hover:bg-white/10 text-white/80"
                                onClick={clearSelection}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

