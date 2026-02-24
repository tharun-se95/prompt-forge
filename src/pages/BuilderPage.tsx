import { useState, useEffect } from "react";
import { usePersonasStore } from "@/store/personas";
import { useSettingsStore } from "@/store/settings";
import { OpenAIProvider } from "@/lib/llm/openai";
import { ClaudeProvider } from "@/lib/llm/claude";
import { OllamaProvider } from "@/lib/llm/ollama";
import { GeminiProvider } from "@/lib/llm/gemini";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Play, Save, Loader2, Copy, Check } from "lucide-react";

export function BuilderPage() {
    const { personas, loadPersonas } = usePersonasStore();
    const { openAiKey, claudeKey, geminiKey, ollamaUrl, defaultModel, loadSettings } = useSettingsStore();

    const [goal, setGoal] = useState("");
    const [context, setContext] = useState("");
    const [selectedPersonaId, setSelectedPersonaId] = useState("");
    const [constraints, setConstraints] = useState("");
    const [outputFormat, setOutputFormat] = useState("");

    const [compiledPrompt, setCompiledPrompt] = useState("");
    const [result, setResult] = useState("");
    const [displayedResult, setDisplayedResult] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadPersonas();
        loadSettings();
    }, [loadPersonas, loadSettings]);

    // Typewriter effect for smoothing large chunks
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const advance = () => {
            setDisplayedResult(prev => {
                if (prev.length < result.length) {
                    timeout = setTimeout(advance, 8); // ~8ms per char for smooth typing
                    return prev + result.charAt(prev.length);
                }
                return prev;
            });
        };

        advance();

        return () => clearTimeout(timeout);
    }, [result]);

    // Handle dynamic compilation purely for display purposes
    useEffect(() => {
        const persona = personas.find(p => p.id === selectedPersonaId);
        let prompt = "";

        if (persona) {
            prompt += `## Role: ${persona.name}\n${persona.mindset}\n\n`;
            prompt += `## Thinking Style\n${persona.thinkingStyle}\n\n`;
        }

        if (goal) prompt += `## Goal\n${goal}\n\n`;
        if (context) prompt += `## Context\n${context}\n\n`;

        const combinedConstraints = [
            ...(persona?.constraints || []),
            ...constraints.split("\\n").filter(c => c.trim().length > 0)
        ];

        if (combinedConstraints.length > 0) {
            prompt += `## Constraints\n${combinedConstraints.map(c => "- " + c).join("\\n")}\n\n`;
        }

        if (outputFormat || persona?.outputFormat) {
            prompt += `## Output Format\n${outputFormat || persona?.outputFormat}\n\n`;
        }

        setCompiledPrompt(prompt.trim());
    }, [goal, context, selectedPersonaId, constraints, outputFormat, personas]);

    const handleGenerate = async () => {
        if (!compiledPrompt) return;
        setIsGenerating(true);
        setError("");
        setResult("");
        setDisplayedResult("");

        try {
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
                [{ role: "user", content: compiledPrompt }],
                {
                    model: defaultModel,
                    maxTokens: 4096,
                    onProgress: (chunk) => {
                        setResult(prev => prev + chunk);
                    }
                }
            );

            // Response is fully gathered, update one last time fully (safety net)
            setResult(response);
        } catch (err: any) {
            setError(err instanceof Error ? err.stack || err.message : JSON.stringify(err));
        } finally {
            setIsGenerating(false);
        }
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
                </div>
            </div>

            {/* Preview & Output Column */}
            <div className="flex flex-col gap-4 h-full overflow-hidden">
                {/* Actions Header */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                    <Button variant="outline" size="sm">
                        <Save className="size-4 mr-2" /> Save Draft
                    </Button>
                    <Button onClick={handleGenerate} disabled={isGenerating || !compiledPrompt}>
                        {isGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Play className="size-4 mr-2" />}
                        Run Prompt
                    </Button>
                </div>

                {/* Compiled Prompt Preview (Collapsible or Tabbed ideally, but here just stacked) */}
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                    <label className="text-sm font-semibold shrink-0">Compiled Prompt Preview</label>
                    <div className="bg-muted/50 border rounded-md p-3 text-xs font-mono whitespace-pre-wrap overflow-y-auto flex-1 text-muted-foreground">
                        {compiledPrompt || "Start building to see the compiled prompt..."}
                    </div>
                </div>

                {/* Action Output */}
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold">AI Response</label>
                            {isGenerating && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                        </div>
                        {displayedResult && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted" onClick={() => {
                                navigator.clipboard.writeText(displayedResult);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }} title="Copy Response">
                                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                            </Button>
                        )}
                    </div>
                    {error && <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20">{error}</div>}
                    <div className="bg-card border rounded-md p-4 text-sm whitespace-pre-wrap overflow-y-auto flex-[2] relative shadow-inner font-mono leading-relaxed">
                        {displayedResult ? (
                            <>
                                {displayedResult}
                                {isGenerating && <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse align-middle" />}
                            </>
                        ) : (
                            !isGenerating && <span className="text-muted-foreground italic">Results will appear here...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
