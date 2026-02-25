import { useEffect } from "react";
import { usePersonasStore } from "@/store/personas";
import { Button } from "@/components/ui/button";
import { Copy, Edit2, Plus, Trash2, ShieldCheck, BrainCircuit } from "lucide-react";

export function PersonasPage() {
    const { personas, loadPersonas, deletePersona } = usePersonasStore();

    useEffect(() => {
        loadPersonas();
    }, [loadPersonas]);

    return (
        <div className="p-4 md:p-8 2xl:p-12 3xl:p-16 4xl:p-20 max-w-[2800px] mx-auto flex flex-col gap-8 md:gap-12 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-1 bg-indigo-500 rounded-full" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Library</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight font-outfit">AI Personas</h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
                        Curate and customize specialized AI agents. Transition between logical frameworks, specialized mindsets, and strict operational constraints.
                    </p>
                </div>
                <Button size="lg" className="h-14 px-8 text-base font-bold premium-gradient text-white shadow-xl shadow-indigo-500/20 active:scale-[0.97] transition-all rounded-2xl group">
                    <Plus className="size-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Create Persona
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-6 md:gap-8">
                {personas.map(persona => (
                    <div
                        key={persona.id}
                        className="group relative border border-white/5 bg-card/40 backdrop-blur-sm rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="p-8 flex-1 relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-muted/50 rounded-2xl border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-colors">
                                    <BrainCircuit className="size-6 text-indigo-400" />
                                </div>
                                {persona.isCustom ? (
                                    <span className="text-[10px] bg-white/5 text-white/40 border border-white/10 px-3 py-1 rounded-full font-black uppercase tracking-widest">Custom</span>
                                ) : (
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">System</span>
                                )}
                            </div>

                            <h3 className="font-outfit font-black text-2xl tracking-tight mb-3 group-hover:text-indigo-400 transition-colors">{persona.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 group-hover:text-foreground/80 transition-colors">
                                {persona.mindset}
                            </p>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-3.5 text-indigo-400/60" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Core Constraints</span>
                                </div>
                                <ul className="space-y-3">
                                    {persona.constraints.slice(0, 3).map((c, i) => (
                                        <li key={i} className="flex items-center gap-3 text-xs text-muted-foreground/80 group-hover:text-foreground/70 transition-colors">
                                            <div className="size-1 rounded-full bg-indigo-500/40" />
                                            <span className="truncate">{c}</span>
                                        </li>
                                    ))}
                                    {persona.constraints.length > 3 && (
                                        <li className="text-[10px] font-bold text-indigo-400/40 pl-4">
                                            + {persona.constraints.length - 3} additional directives
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity duration-300 bg-white/5">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10" title="Duplicate">
                                    <Copy className="size-4" />
                                </Button>
                                {persona.isCustom && (
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10" title="Edit">
                                        <Edit2 className="size-4" />
                                    </Button>
                                )}
                            </div>
                            {persona.isCustom && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => deletePersona(persona.id)}
                                    title="Delete"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Card */}
                <button className="group border-2 border-dashed border-white/5 hover:border-indigo-500/20 rounded-[2rem] flex flex-col items-center justify-center p-12 transition-all duration-500 min-h-[300px] hover:bg-indigo-500/5">
                    <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-500">
                        <Plus className="size-8 text-white/20 group-hover:text-indigo-400" />
                    </div>
                    <span className="font-outfit font-black text-lg tracking-tight text-white/20 group-hover:text-indigo-400">Initialize Agent</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/10 mt-2">Add to library</span>
                </button>
            </div>
        </div>
    );
}
