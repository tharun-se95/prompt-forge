import { useEffect } from 'react';
import { Drawer } from 'vaul';
import { BookMarked, Trash2, Plus, X } from 'lucide-react';
import { useSnippetStore, Snippet } from '../store/snippets';

interface SnippetSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (content: string) => void;
}

export function SnippetSidebar({ open, onOpenChange, onInsert }: SnippetSidebarProps) {
    const { snippets, isLoaded, loadSnippets, deleteSnippet } = useSnippetStore();

    useEffect(() => {
        if (open && !isLoaded) {
            loadSnippets();
        }
    }, [open, isLoaded, loadSnippets]);

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
                <Drawer.Content className="bg-slate-900 flex flex-col rounded-l-2xl h-full w-[400px] mt-24 fixed bottom-0 right-0 z-[101] border-l border-white/10 shadow-2xl focus:outline-none">
                    <div className="p-6 flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <BookMarked size={20} />
                                <h2 className="font-outfit text-xl font-semibold text-slate-100">Knowledge Library</h2>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-full transition-colors focus:outline-none"
                                aria-label="Close sidebar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 pb-6">
                            {!isLoaded ? (
                                <div className="text-center text-slate-500 mt-10">Loading snippets...</div>
                            ) : snippets.length === 0 ? (
                                <div className="text-center text-slate-500 mt-10 px-4">
                                    <BookMarked className="mx-auto mb-3 opacity-20" size={48} />
                                    <p className="text-sm">No snippets found.</p>
                                    <p className="text-xs mt-2">Highlight text in the Context box to save a reusable snippet.</p>
                                </div>
                            ) : (
                                snippets.map((snippet) => (
                                    <SnippetCard
                                        key={snippet.id}
                                        snippet={snippet}
                                        onInsert={() => {
                                            onInsert(snippet.content);
                                            onOpenChange(false);
                                        }}
                                        onDelete={() => deleteSnippet(snippet.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}

function SnippetCard({ snippet, onInsert, onDelete }: { snippet: Snippet, onInsert: () => void, onDelete: () => void }) {
    return (
        <div className="group relative bg-slate-800/50 border border-white/5 rounded-xl p-4 transition-all duration-200 hover:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/50">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-slate-200 truncate pr-8">{snippet.title}</h3>
                <button
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                    title="Delete Snippet"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4 font-mono">
                {snippet.content}
            </p>

            <button
                onClick={onInsert}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
                <Plus size={14} /> Insert Snippet
            </button>
        </div>
    )
}
