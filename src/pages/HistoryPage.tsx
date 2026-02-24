export function HistoryPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 h-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">History</h1>
                <p className="text-muted-foreground mt-2">Review past prompt workflows and generation results.</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border bg-card rounded-xl border-dashed">
                <p>No history recorded yet.</p>
                <p className="text-sm opacity-50">Saved prompts will appear here.</p>
            </div>
        </div>
    );
}
