import { useEffect } from "react";
import { useHistoryStore } from "@/store/history";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Cpu } from "lucide-react";

export function HistoryPage() {
    const { history, loadHistory } = useHistoryStore();

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return (
        <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 h-full overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">History</h1>
                <p className="text-muted-foreground mt-2">Review past prompt workflows and generation results.</p>
            </div>

            <ScrollArea className="flex-1 pr-4">
                {history.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground border bg-card rounded-xl border-dashed">
                        <p>No history recorded yet.</p>
                        <p className="text-sm opacity-50">Saved prompts will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-10">
                        {history.map((entry) => (
                            <Card key={entry.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
                                                <User className="size-3" /> {entry.personaName}
                                            </Badge>
                                            <Badge variant="secondary" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
                                                <Cpu className="size-3" /> {entry.model}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                            <Clock className="size-3" /> {new Date(entry.timestamp!).toLocaleString()}
                                        </div>
                                    </div>
                                    <CardTitle className="text-sm mt-2 line-clamp-1">{entry.goal || "No Goal Specified"}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Final Prompt</span>
                                        <p className="text-xs bg-muted/20 p-2 rounded border font-mono line-clamp-2 text-muted-foreground whitespace-pre-wrap">
                                            {entry.prompt}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">AI Response</span>
                                        <div className="text-sm bg-card p-3 rounded border font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                            {entry.response}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
