import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, GitBranch, Trash2, Edit2, Check, X } from 'lucide-react';
import { useBranchStore, BranchStateSnapshot } from '../store/branches';
import { useBuilderStore } from '../store/builder';

export function BranchTabBar() {
    const {
        branches, activeBranchId, isLoaded, loadBranches,
        createBranch, updateBranch, deleteBranch, setActiveBranchId
    } = useBranchStore();

    const {
        goal, context, selectedPersonaId, constraints, outputFormat,
        setGoal, setContext, setSelectedPersonaId, setConstraints, setOutputFormat
    } = useBuilderStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    const handleCreateBranch = async () => {
        const currentState: BranchStateSnapshot = {
            goal,
            context,
            selectedPersonaId,
            constraints,
            outputFormat
        };

        // Default name
        const branchNumber = branches.length + 1;
        await createBranch(`Version ${branchNumber}`, currentState);
    };

    const handleSwitchBranch = async (id: string) => {
        if (id === activeBranchId) return;

        const targetBranch = branches.find(b => b.id === id);
        if (!targetBranch) return;

        // Inject state into form
        setGoal(targetBranch.state.goal);
        setContext(targetBranch.state.context);
        setSelectedPersonaId(targetBranch.state.selectedPersonaId);
        setConstraints(targetBranch.state.constraints);
        setOutputFormat(targetBranch.state.outputFormat);

        await setActiveBranchId(id);
    };

    const startEditing = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    const saveEditing = async (id: string) => {
        if (editName.trim()) {
            await updateBranch(id, editName.trim());
        }
        setEditingId(null);
    };

    if (!isLoaded) return <div className="h-10 animate-pulse bg-white/5 rounded-lg mb-4" />;

    return (
        <div className="flex items-center gap-2 mb-6 bg-card/40 p-1.5 rounded-xl border border-white/5 shadow-sm overflow-x-auto scrollbar-hide">
            <div className="flex items-center text-indigo-400 pl-2 pr-4 border-r border-white/10 opacity-70">
                <GitBranch size={16} className="mr-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Branches</span>
            </div>

            <div className="flex items-center gap-1 flex-1">
                {branches.map(branch => {
                    const isActive = branch.id === activeBranchId;

                    return (
                        <div
                            key={branch.id}
                            className="relative group flex items-center"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-branch"
                                    className="absolute inset-0 bg-indigo-500/20 rounded-lg border border-indigo-500/30"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <div
                                className={`relative flex items-center h-8 px-4 py-1 text-sm font-medium rounded-lg transition-colors cursor-pointer z-10 ${isActive ? "text-indigo-200" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }`}
                                onClick={() => !editingId && handleSwitchBranch(branch.id)}
                            >
                                {editingId === branch.id ? (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="bg-background border border-indigo-400/50 rounded px-2 w-24 h-6 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') saveEditing(branch.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                        />
                                        <button onClick={() => saveEditing(branch.id)} className="text-emerald-400 hover:text-emerald-300">
                                            <Check size={14} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="truncate max-w-[120px]">{branch.name}</span>

                                        {/* Action Buttons (Visible on Hover if Active or Hovered) */}
                                        <div className={`ml-2 flex items-center gap-1 opacity-0 ${isActive ? 'group-hover:opacity-100' : 'group-hover:opacity-50 hover:!opacity-100'} transition-opacity`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditing(branch.id, branch.name); }}
                                                className="p-1 hover:text-indigo-300 rounded"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteBranch(branch.id); }}
                                                className="p-1 hover:text-rose-400 rounded"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleCreateBranch}
                className="flex shrink-0 items-center justify-center gap-2 h-8 px-3 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors ml-auto mr-1 border border-emerald-500/20"
            >
                <Plus size={14} /> Snapshot
            </button>
        </div>
    );
}
