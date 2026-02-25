import { useState, useEffect, useRef } from "react";
import { usePersonasStore } from "@/store/personas";
import { useSettingsStore } from "@/store/settings";
import { OpenAIProvider } from "@/lib/llm/openai";
import { ClaudeProvider } from "@/lib/llm/claude";
import { OllamaProvider } from "@/lib/llm/ollama";
import { GeminiProvider } from "@/lib/llm/gemini";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useBuilderStore } from "@/store/builder";
import { useHistoryStore } from "@/store/history";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, Copy, Check, Trash2, Eye, EyeOff, Zap, FileText, BarChart3, Edit3, Wand2, BookMarked, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableBlock } from "@/components/DraggableBlock";
import { SnippetSidebar } from "@/components/SnippetSidebar";
import { useSnippetStore } from "@/store/snippets";
import { ConstraintsInput } from "@/components/ConstraintsInput";
import { BranchTabBar } from "@/components/BranchTabBar";
import { SchemaBuilder } from "@/components/SchemaBuilder";
import { OutputFormat } from "@/store/builder";

export function BuilderPage() {
    const { personas } = usePersonasStore();
    const { openAiKey, claudeKey, geminiKey, ollamaUrl, defaultModel } = useSettingsStore();

    const {
        goal, setGoal,
        context, setContext,
        selectedPersonaId, setSelectedPersonaId,
        constraints, setConstraints,
        outputFormat, setOutputFormat,
        blockOrder, setBlockOrder,
        lastResult, setLastResult
    } = useBuilderStore();

    const [isReordering, setIsReordering] = useState(false);
    const { addSnippet } = useSnippetStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedContextText, setSelectedContextText] = useState("");
    const contextTextareaRef = useRef<HTMLTextAreaElement>(null);

    const { addEntry } = useHistoryStore();

    const [compiledPrompt, setCompiledPrompt] = useState("");
    const [result, setResult] = useState("");
    const [displayedResult, setDisplayedResult] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isMarkdown, setIsMarkdown] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll as text is typed
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [displayedResult]);

    // Sync lastResult from store to local state on load
    useEffect(() => {
        if (lastResult && !result) {
            setResult(lastResult);
            setDisplayedResult(lastResult);
        }
    }, [lastResult, result]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = blockOrder.indexOf(active.id as string);
            const newIndex = blockOrder.indexOf(over.id as string);
            setBlockOrder(arrayMove(blockOrder, oldIndex, newIndex));
        }
    };

    // Typewriter effect for smoothing large chunks
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const advance = () => {
            setDisplayedResult(prev => {
                const diff = result.length - prev.length;
                if (diff > 0) {
                    // Slower baseline (25ms), but speeds up if the buffer gets too big (> 200 chars)
                    const speed = diff > 200 ? 5 : 25;
                    timeout = setTimeout(advance, speed);
                    return prev + result.charAt(prev.length);
                }
                return prev;
            });
        };

        advance();

        return () => clearTimeout(timeout);
    }, [result]);

    // Handle dynamic compilation purely for display purposes (now as a preview of the structured prompt)
    useEffect(() => {
        const persona = personas.find(p => p.id === selectedPersonaId);
        let prompt = "";

        if (persona) {
            prompt += `[SYSTEM ROLE]\n${persona.name}: ${persona.mindset}\n\n`;
        }

        const compileBlock = (blockId: string) => {
            switch (blockId) {
                case 'goal':
                    if (goal) prompt += `[GOAL]\n${goal}\n\n`;
                    break;
                case 'context':
                    if (context) prompt += `[CONTEXT]\n${context}\n\n`;
                    break;
                case 'constraints':
                    const parseConstraint = (c: string) => {
                        const trimmed = c.trim();
                        if (trimmed.startsWith('!')) return `<important_constraint>${trimmed.slice(1).trim()}</important_constraint>`;
                        if (trimmed.startsWith('?')) return `<optional_style>${trimmed.slice(1).trim()}</optional_style>`;
                        return trimmed;
                    };
                    const combinedConstraints = [
                        ...(persona?.constraints || []),
                        ...constraints.split("\n").filter((c: string) => c.trim().length > 0)
                    ];
                    if (combinedConstraints.length > 0) {
                        prompt += `[CONSTRAINTS]\n${combinedConstraints.map(c => "- " + parseConstraint(c)).join("\n")}\n\n`;
                    }
                    break;
                case 'outputFormat':
                    const formatOutput = (format: OutputFormat, fallback?: string) => {
                        if (format.mode === 'structured') {
                            if (format.schema.length === 0) return fallback || "";
                            let schemaStr = "Return a JSON object matching this strict schema:\n{\n";
                            format.schema.forEach((field, i) => {
                                const comma = i === format.schema.length - 1 ? "" : ",";
                                schemaStr += `  "${field.key}": <${field.type}> // ${field.description}${comma}\n`;
                            });
                            schemaStr += "}";
                            return schemaStr;
                        }
                        return format.raw.trim() || fallback || "";
                    };

                    const compiledOutputFormat = formatOutput(outputFormat, persona?.outputFormat);
                    if (compiledOutputFormat) {
                        prompt += `[OUTPUT FORMAT]\n${compiledOutputFormat}\n\n`;
                    }
                    break;
            }
        };

        // Synthesize in block order
        blockOrder.forEach(compileBlock);

        setCompiledPrompt(prompt.trim());
    }, [goal, context, selectedPersonaId, constraints, outputFormat, personas, blockOrder]);

    const handleContextSelection = () => {
        if (contextTextareaRef.current) {
            const selectedText = contextTextareaRef.current.value.substring(
                contextTextareaRef.current.selectionStart,
                contextTextareaRef.current.selectionEnd
            );
            setSelectedContextText(selectedText);
        }
    };

    const handleSaveSnippet = async () => {
        if (!selectedContextText.trim()) return;
        const title = window.prompt("Enter a title for this snippet:");
        if (title) {
            await addSnippet({ title, content: selectedContextText });
            setSelectedContextText(""); // Clear selection state after save
        }
    };

    const handleGenerate = async () => {
        if (!goal && !context) return;
        setIsGenerating(true);
        setError("");
        setResult("");
        setDisplayedResult("");

        try {
            const persona = personas.find(p => p.id === selectedPersonaId);

            // Build structured messages
            const messages: any[] = [];

            if (persona) {
                messages.push({
                    role: "system",
                    content: `You are a professional Meta-Prompt Engineer. Your ONLY task is to draft a high-quality, structured, and effective PROMPT that a user can use with another AI (like Cursor, ChatGPT, or Claude) to achieve a specific goal.\n\nAdopt the mindset of a ${persona.name} specializing in Prompt Engineering.\n\nPersona Mindset: ${persona.mindset}\n\nThinking Style for Prompt Drafting: ${persona.thinkingStyle}\n\nDo not perform the task described in the Goal. Instead, write a PROMPT that tells ANOTHER AI how to perform that task perfectly.`
                });
            }

            let userContent = "";

            const compileBlockForLLM = (blockId: string) => {
                switch (blockId) {
                    case 'goal':
                        if (goal) userContent += `## GOAL\n${goal}\n\n`;
                        break;
                    case 'context':
                        if (context) userContent += `## CONTEXT / DATA\n${context}\n\n`;
                        break;
                    case 'constraints':
                        const parseConstraint = (c: string) => {
                            const trimmed = c.trim();
                            if (trimmed.startsWith('!')) return `<important_constraint>${trimmed.slice(1).trim()}</important_constraint>`;
                            if (trimmed.startsWith('?')) return `<optional_style>${trimmed.slice(1).trim()}</optional_style>`;
                            return trimmed;
                        };
                        const rawConstraints = constraints.split("\n").filter(c => c.trim().length > 0);
                        const allConstraints = [...(persona?.constraints || []), ...rawConstraints];
                        if (allConstraints.length > 0) {
                            userContent += `## CONSTRAINTS\n${allConstraints.map(c => "- " + parseConstraint(c)).join("\n")}\n\n`;
                        }
                        break;
                    case 'outputFormat':
                        const formatOutput = (format: OutputFormat, fallback?: string) => {
                            if (format.mode === 'structured') {
                                if (format.schema.length === 0) return fallback || "";
                                let schemaStr = "Return a JSON object matching this strict schema:\n{\n";
                                format.schema.forEach((field, i) => {
                                    const comma = i === format.schema.length - 1 ? "" : ",";
                                    schemaStr += `  "${field.key}": <${field.type}> // ${field.description}${comma}\n`;
                                });
                                schemaStr += "}";
                                return schemaStr;
                            }
                            return format.raw.trim() || fallback || "";
                        };

                        const compiledOutputFormat = formatOutput(outputFormat, persona?.outputFormat);
                        if (compiledOutputFormat) {
                            userContent += `## DESIRED OUTPUT FORMAT\n${compiledOutputFormat}\n\n`;
                        }
                        break;
                }
            };

            blockOrder.forEach(compileBlockForLLM);

            messages.push({ role: "user", content: userContent.trim() });

            let provider;
            if (defaultModel.includes("gpt")) {
                provider = new OpenAIProvider(openAiKey);
            } else if (defaultModel.includes("claude")) {
                provider = new ClaudeProvider(claudeKey);
            } else if (defaultModel.includes("gemini")) {
                provider = new GeminiProvider(geminiKey);
            } else {
                provider = new OllamaProvider(ollamaUrl);
            }

            const response = await provider.generate(
                messages,
                {
                    model: defaultModel,
                    maxTokens: 16384,
                    onProgress: (chunk) => {
                        setResult(prev => prev + chunk);
                    }
                }
            );

            // Response is fully gathered, update states fully
            setResult(response);
            setDisplayedResult(response); // Force sync displayed content
            setLastResult(response);
            toast.success("Prompt crafted successfully!");

            // Record in history
            await addEntry({
                personaName: persona?.name || "No Persona",
                personaId: selectedPersonaId,
                goal: goal,
                context: context,
                constraints: constraints,
                outputFormat: outputFormat.mode === 'simple' ? outputFormat.raw : JSON.stringify(outputFormat.schema),
                prompt: userContent, // Store the final user prompt
                response: response,
                model: defaultModel
            });
        } catch (err: any) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(err instanceof Error ? err.stack || err.message : JSON.stringify(err));
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveManual = async () => {
        if (!displayedResult || isGenerating) return;
        const persona = personas.find(p => p.id === selectedPersonaId);
        await addEntry({
            personaName: persona?.name || "No Persona",
            personaId: selectedPersonaId,
            goal: goal,
            context: context,
            constraints: constraints,
            outputFormat: outputFormat.mode === 'simple' ? outputFormat.raw : JSON.stringify(outputFormat.schema),
            prompt: compiledPrompt,
            response: displayedResult,
            model: defaultModel
        });
        toast.success("Saved to history");
    };

    const handleClearResult = () => {
        setResult("");
        setDisplayedResult("");
        setLastResult("");
        toast.info("Response cleared");
    };

    const handleResultChange = (val: string) => {
        setResult(val);
        setDisplayedResult(val);
        setLastResult(val);
    };

    return (
        <div className="p-4 md:p-6 2xl:p-12 3xl:px-22 4xl:px-30 max-w-[2800px] mx-auto grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 2xl:gap-12 h-full overflow-hidden">
            {/* 1. Input Column */}
            <div className="flex flex-col gap-6 overflow-y-auto pr-4 pb-20 2xl:pb-0 scrollbar-hide">
                <div className="mb-2">
                    <h1 className="text-4xl font-extrabold tracking-tight font-outfit bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">Prompt Forge</h1>
                    <p className="text-muted-foreground mt-2 text-sm max-w-md leading-relaxed">Draft elite prompts using modular engineering blocks and professional AI personas.</p>
                </div>

                <BranchTabBar />

                <div className="space-y-4 mt-2">
                    {/* Role Selection */}
                    <div className="space-y-2 bg-card/40 p-4 rounded-2xl border border-white/5 shadow-sm">
                        <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">🧠 Role / Persona</label>
                        <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                            <SelectTrigger className="bg-background/50 border-white/10 h-11">
                                <SelectValue placeholder="Select a persona to adopt..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover/90 backdrop-blur-xl border-white/10">
                                {personas.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="focus:bg-indigo-500/20">{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">🧠 Builder Configuration</label>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 px-3 text-xs shrink-0 flex items-center gap-2 border transition-colors ${isReordering ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500/30 font-bold' : 'hover:bg-accent border-white/10'}`}
                            onClick={() => setIsReordering(!isReordering)}
                        >
                            <GripVertical className="size-3.5" />
                            {isReordering ? "Done Reordering" : "Reorder Blocks"}
                        </Button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={blockOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-1 gap-6 p-1">
                                {blockOrder.map((blockId) => {
                                    switch (blockId) {
                                        case 'goal':
                                            return (
                                                <DraggableBlock key="goal" id="goal" isReordering={isReordering}>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">🎯 Goal</label>
                                                        <Textarea
                                                            placeholder="What do you want the AI to achieve?"
                                                            value={goal}
                                                            onChange={e => setGoal(e.target.value)}
                                                            className="resize-none h-24 bg-background/40 border-white/10 focus:border-indigo-500/50 transition-colors text-base"
                                                        />
                                                    </div>
                                                </DraggableBlock>
                                            );
                                        case 'context':
                                            return (
                                                <DraggableBlock key="context" id="context" isReordering={isReordering}>
                                                    <div className="space-y-2 relative">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">📄 Context</label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 pointer-events-auto"
                                                                onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
                                                            >
                                                                <BookMarked className="size-3 mr-1" /> View Library
                                                            </Button>
                                                        </div>
                                                        <div className="relative pointer-events-auto">
                                                            <Textarea
                                                                ref={contextTextareaRef}
                                                                placeholder="Paste relevant code, background info, or requirements... (Highlight text to save as snippet)"
                                                                value={context}
                                                                onChange={e => setContext(e.target.value)}
                                                                onSelect={handleContextSelection}
                                                                onKeyUp={handleContextSelection}
                                                                onMouseUp={handleContextSelection}
                                                                className="font-mono text-xs h-40 bg-background/40 border-white/10 focus:border-indigo-500/50 transition-colors pb-10"
                                                            />
                                                            {selectedContextText.trim().length > 0 && (
                                                                <div className="absolute bottom-2 right-2 animate-in fade-in slide-in-from-bottom-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleSaveSnippet(); }}
                                                                        className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg pointer-events-auto"
                                                                    >
                                                                        <Save className="size-3 mr-1.5" /> Save Snippet
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </DraggableBlock>
                                            );
                                        case 'constraints':
                                            return (
                                                <DraggableBlock key="constraints" id="constraints" isReordering={isReordering}>
                                                    <div className="space-y-3 pb-4">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">⚙ Constraints</label>
                                                        <ConstraintsInput
                                                            value={constraints}
                                                            onChange={setConstraints}
                                                            placeholder="List rules (one per line)..."
                                                            className="h-32 w-full pointer-events-auto"
                                                        />
                                                    </div>
                                                </DraggableBlock>
                                            );
                                        case 'outputFormat':
                                            return (
                                                <DraggableBlock key="outputFormat" id="outputFormat" isReordering={isReordering}>
                                                    <div className="space-y-3 relative pb-4">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">📊 Output Format</label>
                                                        <SchemaBuilder
                                                            value={outputFormat}
                                                            onChange={setOutputFormat}
                                                            className="pt-1 mt-0 pointer-events-auto"
                                                        />
                                                    </div>
                                                </DraggableBlock>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Collapsible Compiled Prompt Preview (Mobile/Lower Desktop Only) */}
                    <div className="pt-4 border-t 2xl:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between text-muted-foreground hover:text-foreground p-0 h-auto"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <span className="text-xs font-semibold uppercase tracking-wider">Compiled Prompt Preview</span>
                            {showPreview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>

                        {showPreview && (
                            <div className="mt-3 bg-muted/30 border rounded-md p-3 text-[10px] font-mono whitespace-pre-wrap text-muted-foreground animate-in fade-in slide-in-from-top-1">
                                {compiledPrompt || "Start building to see the compiled prompt..."}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex items-center gap-3 mt-auto">
                    <Button
                        size="lg"
                        className="flex-1 h-14 text-lg font-bold premium-gradient text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 active:scale-[0.97] hover:premium-glow group relative overflow-hidden"
                        onClick={handleGenerate}
                        disabled={isGenerating || !goal}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <div className="relative flex items-center justify-center gap-3">
                            {isGenerating ? (
                                <Loader2 className="animate-spin size-5" />
                            ) : (
                                <Wand2 className="size-5" />
                            )}
                            {isGenerating ? "Forging..." : "Craft Prompt"}
                        </div>
                    </Button>
                </div>
            </div>

            {/* 2. Center Column: Live Engine Synthesis (Visible on 2xl+) */}
            <div className="hidden 2xl:flex flex-col gap-6 h-full overflow-hidden">
                <div className="flex flex-col h-full bg-card/20 p-8 rounded-[2.5rem] border border-white/5 relative group">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Live Engine</span>
                            <h3 className="font-outfit font-bold text-xl tracking-tight">Compiled Logic</h3>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5" onClick={() => navigator.clipboard.writeText(compiledPrompt)} title="Copy compiled prompt">
                            <Copy className="size-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 font-mono text-[13px] leading-relaxed relative">
                        <div className="p-1 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                            {compiledPrompt ? (
                                <div className="whitespace-pre-wrap">{compiledPrompt}</div>
                            ) : (
                                <div className="italic text-muted-foreground/40">Synthesizing prompt blocks in real-time...</div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Active Synthesis</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-30">{compiledPrompt.length} chars</span>
                    </div>
                </div>
            </div>

            {/* 3. Output Area (Right Column) */}
            <div className="flex flex-col gap-6 h-full overflow-hidden lg:pl-4 2xl:pl-0">
                {/* Actions Header */}
                <div className="flex items-center justify-between shrink-0 mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span>Generated Prompt</span>
                        {isGenerating && <Loader2 className="size-4 animate-spin text-primary" />}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={handleSaveManual}
                            disabled={!displayedResult || isGenerating}
                        >
                            <Save className="size-3.5 mr-2" /> Save
                        </Button>
                        <Button
                            size="lg"
                            className="h-10 px-6 text-sm font-bold premium-gradient premium-glow border-0 hover:opacity-90 active:scale-[0.97] transition-all"
                            onClick={handleGenerate}
                            disabled={isGenerating || !compiledPrompt}
                        >
                            {isGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Zap className="size-4 mr-2 fill-current" />}
                            Craft Prompt
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl shadow-sm overflow-hidden relative">
                    {/* Toolbar for Response */}
                    <div className="p-2 border-b bg-muted/20 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-2">
                            {displayedResult && (
                                <>
                                    <span className="flex items-center gap-1"><FileText className="size-2.5" /> {displayedResult.split(/\s+/).length} words</span>
                                    <span className="flex items-center gap-1"><BarChart3 className="size-2.5" /> {displayedResult.length} chars</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {displayedResult && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 px-2 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${isMarkdown ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-muted'}`}
                                    onClick={() => setIsMarkdown(!isMarkdown)}
                                >
                                    {isMarkdown ? <Eye className="size-3 mr-1" /> : <Edit3 className="size-3 mr-1" />}
                                    {isMarkdown ? "Preview" : "Edit"}
                                </Button>
                            )}
                            {displayedResult && !isGenerating && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                    onClick={handleClearResult}
                                    title="Clear Response"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                            {displayedResult && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={() => {
                                    navigator.clipboard.writeText(displayedResult);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }} title="Copy Response">
                                    {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && <div className="m-3 text-destructive text-xs p-3 bg-destructive/10 rounded-md border border-destructive/20">{error}</div>}

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {isGenerating ? (
                            <div
                                ref={scrollContainerRef}
                                className="h-full p-4 text-sm whitespace-pre-wrap overflow-y-auto font-mono leading-relaxed bg-transparent"
                            >
                                {displayedResult}
                                <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse align-middle" />
                            </div>
                        ) : isMarkdown ? (
                            <div className="h-full p-6 overflow-y-auto prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || "");
                                            return !inline && match ? (
                                                <div className="relative group">
                                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 bg-background/50 backdrop-blur"
                                                            onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))}
                                                        >
                                                            <Copy className="size-3" />
                                                        </Button>
                                                    </div>
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, "")}
                                                    </SyntaxHighlighter>
                                                </div>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        // Better formatting for tables and lists
                                        table: ({ children }) => <table className="border-collapse border border-muted w-full my-4 text-xs">{children}</table>,
                                        th: ({ children }) => <th className="border border-muted bg-muted/20 p-2 text-left">{children}</th>,
                                        td: ({ children }) => <td className="border border-muted p-2">{children}</td>,
                                        p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>,
                                        h1: ({ children }) => <h1 className="text-xl font-bold mb-4 mt-6 text-primary border-b pb-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-5 text-primary/90">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>,
                                        ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/40 pl-4 py-1 italic text-muted-foreground my-4 bg-muted/10 rounded-r-md">{children}</blockquote>,
                                    }}
                                >
                                    {displayedResult}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <Textarea
                                value={displayedResult}
                                onChange={(e) => handleResultChange(e.target.value)}
                                placeholder="Your engineered prompt will appear here..."
                                className="h-full w-full font-mono text-sm leading-relaxed p-4 bg-transparent border-0 focus-visible:ring-0 resize-none"
                            />
                        )}
                        {!displayedResult && !isGenerating && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                                <Zap className="size-8 mb-2" />
                                <span className="text-xs italic">Results will appear here...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SnippetSidebar
                open={isSidebarOpen}
                onOpenChange={setIsSidebarOpen}
                onInsert={(snippetContent) => {
                    const addition = context.trim() ? `\n\n${snippetContent}` : snippetContent;
                    setContext(context + addition);
                }}
            />
        </div>
    );
}
