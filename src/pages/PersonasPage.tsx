import { useEffect } from "react";
import { usePersonasStore } from "@/store/personas";
import { Button } from "@/components/ui/button";
import { Copy, Edit2, Plus, Trash2 } from "lucide-react";

export function PersonasPage() {
    const { personas, loadPersonas, deletePersona } = usePersonasStore();

    useEffect(() => {
        loadPersonas();
    }, [loadPersonas]);

    return (
        <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
                    <p className="text-muted-foreground mt-2">Manage AI roles and constraints for prompt workflows.</p>
                </div>
                <Button>
                    <Plus className="size-4 mr-2" />
                    Create Persona
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map(persona => (
                    <div key={persona.id} className="border bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg">{persona.name}</h3>
                                {persona.isCustom && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Custom</span>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{persona.mindset}</p>

                            <div className="mt-4 space-y-2">
                                <div className="text-xs font-medium text-foreground/80 uppercase tracking-wider">Constraints</div>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                    {persona.constraints.slice(0, 3).map((c, i) => (
                                        <li key={i} className="truncate">{c}</li>
                                    ))}
                                    {persona.constraints.length > 3 && <li className="text-muted-foreground/50 list-none text-xs mt-1">+{persona.constraints.length - 3} more</li>}
                                </ul>
                            </div>
                        </div>
                        <div className="bg-muted/30 px-6 py-3 border-t flex items-center gap-2 justify-end">
                            <Button variant="ghost" size="icon" title="Duplicate"><Copy className="size-4" /></Button>
                            {persona.isCustom && (
                                <>
                                    <Button variant="ghost" size="icon" title="Edit"><Edit2 className="size-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deletePersona(persona.id)} title="Delete"><Trash2 className="size-4" /></Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
