import { useState, useEffect, useRef } from "react";
import { usePersonasStore } from "@/store/personas";
import { useSettingsStore } from "@/store/settings";
import { OpenAIProvider } from "@/lib/llm/openai";
import { ClaudeProvider } from "@/lib/llm/claude";
import { OllamaProvider } from "@/lib/llm/ollama";
import { GeminiProvider } from "@/lib/llm/gemini";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/store/builder";
import { useHistoryStore } from "@/store/history";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Play, Save, Loader2, Copy, Check, Trash2, Eye, EyeOff, Zap, FileText, BarChart3, Edit3 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export function BuilderPage() {
    const { personas } = usePersonasStore();
    const { openAiKey, claudeKey, geminiKey, ollamaUrl, defaultModel } = useSettingsStore();

    const {
        goal, setGoal,
        context, setContext,
        selectedPersonaId, setSelectedPersonaId,
        constraints, setConstraints,
        outputFormat, setOutputFormat,
        lastResult, setLastResult
    } = useBuilderStore();

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

        if (goal) prompt += `[GOAL]\n${goal}\n\n`;
        if (context) prompt += `[CONTEXT]\n${context}\n\n`;

        const combinedConstraints = [
            ...(persona?.constraints || []),
            ...constraints.split("\n").filter((c: string) => c.trim().length > 0)
        ];

        if (combinedConstraints.length > 0) {
            prompt += `[CONSTRAINTS]\n${combinedConstraints.map(c => "- " + c).join("\n")}\n\n`;
        }

        if (outputFormat || persona?.outputFormat) {
            prompt += `[OUTPUT FORMAT]\n${outputFormat || persona?.outputFormat}\n\n`;
        }

        setCompiledPrompt(prompt.trim());
    }, [goal, context, selectedPersonaId, constraints, outputFormat, personas]);

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
                    content: `Adopt the persona: ${persona.name}\n\nMindset: ${persona.mindset}\n\nThinking Style: ${persona.thinkingStyle}`
                });
            }

            let userContent = "";
            if (goal) userContent += `## GOAL\n${goal}\n\n`;
            if (context) userContent += `## CONTEXT / DATA\n${context}\n\n`;

            const rawConstraints = constraints.split("\n").filter(c => c.trim().length > 0);
            const allConstraints = [...(persona?.constraints || []), ...rawConstraints];

            if (allConstraints.length > 0) {
                userContent += `## CONSTRAINTS\n${allConstraints.map(c => "- " + c).join("\n")}\n\n`;
            }

            const format = outputFormat || persona?.outputFormat;
            if (format) {
                userContent += `## DESIRED OUTPUT FORMAT\n${format}\n\n`;
            }

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
            toast.success("Generation complete!");

            // Record in history
            await addEntry({
                personaName: persona?.name || "No Persona",
                personaId: selectedPersonaId,
                goal: goal,
                context: context,
                constraints: constraints,
                outputFormat: outputFormat,
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
            outputFormat: outputFormat,
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
        <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Builder Column */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Prompt Builder</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Design structured prompts using modular blocks.</p>
                </div>

                <div className="space-y-4 mt-2">
                    {/* Role Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">🧠 Role / Persona</label>
                        <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a persona to adopt..." />
                            </SelectTrigger>
                            <SelectContent>
                                {personas.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Goal Block */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">🎯 Goal</label>
                        <Textarea
                            placeholder="What do you want the AI to achieve?"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            className="resize-none h-20"
                        />
                    </div>

                    {/* Context Block */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">📄 Context</label>
                        <Textarea
                            placeholder="Paste relevant code, background info, or requirements..."
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            className="font-mono text-sm h-32"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Custom Constraints */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">⚙ Constraints</label>
                            <Textarea
                                placeholder="List rules (one per line)..."
                                value={constraints}
                                onChange={e => setConstraints(e.target.value)}
                                className="h-20"
                            />
                        </div>

                        {/* Output Format */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">📊 Output Format</label>
                            <Input
                                placeholder="e.g. JSON, Markdown table..."
                                value={outputFormat}
                                onChange={e => setOutputFormat(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Collapsible Compiled Prompt Preview */}
                    <div className="pt-4 border-t">
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
            </div>

            {/* Preview & Output Column (Right side - Now full height for Response) */}
            <div className="flex flex-col gap-4 h-full overflow-hidden border-l pl-6">
                {/* Actions Header */}
                <div className="flex items-center justify-between shrink-0 mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span>AI Response</span>
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
                            size="sm"
                            className="h-8 px-4 text-xs font-bold"
                            onClick={handleGenerate}
                            disabled={isGenerating || !compiledPrompt}
                        >
                            {isGenerating ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Play className="size-3.5 mr-2" />}
                            Run Prompt
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
                                placeholder="AI output will appear here..."
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
        </div>
    );
}
