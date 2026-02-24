import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export function SettingsPage() {
    const { setOpenAiKey, setClaudeKey, setGeminiKey, setOllamaUrl, setDefaultModel, loadSettings } = useSettingsStore();

    const [localOAI, setLocalOAI] = useState("");
    const [localClaude, setLocalClaude] = useState("");
    const [localGemini, setLocalGemini] = useState("");
    const [localOllamaUrl, setLocalOllamaUrl] = useState("");
    const [localModel, setLocalModel] = useState("");
    const [customModel, setCustomModel] = useState("");

    useEffect(() => {
        loadSettings().then(() => {
            const state = useSettingsStore.getState();
            setLocalOAI(state.openAiKey);
            setLocalClaude(state.claudeKey);
            setLocalGemini(state.geminiKey);
            setLocalOllamaUrl(state.ollamaUrl);

            const model = state.defaultModel;
            if (["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20240620", "claude-3-haiku-20240307", "gemini-2.5-flash", "gemini-2.5-pro", "qwen3:8b", "qwen2.5:14b", "phi3:mini", "llama3.1", "qwen2.5-coder"].includes(model)) {
                setLocalModel(model);
            } else {
                setLocalModel("custom");
                setCustomModel(model);
            }
        });
    }, [loadSettings]);

    const handleSave = async () => {
        await setOpenAiKey(localOAI);
        await setClaudeKey(localClaude);
        await setGeminiKey(localGemini);
        await setOllamaUrl(localOllamaUrl);
        await setDefaultModel(localModel === "custom" ? customModel : localModel);
        alert("Settings saved successfully.");
    };

    return (
        <div className="p-6 max-w-3xl mx-auto flex flex-col gap-8 h-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">Configure local LLM providers and preferences.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold">API Keys</h2>
                    <p className="text-sm text-muted-foreground">Keys are stored locally and encrypted by the OS.</p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">OpenAI API Key</label>
                        <Input
                            type="password"
                            placeholder="sk-..."
                            value={localOAI}
                            onChange={e => setLocalOAI(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Anthropic Claude API Key</label>
                        <Input
                            type="password"
                            placeholder="sk-ant-..."
                            value={localClaude}
                            onChange={e => setLocalClaude(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Google Gemini API Key</label>
                        <Input
                            type="password"
                            placeholder="AIza..."
                            value={localGemini}
                            onChange={e => setLocalGemini(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold">Local Server (Ollama)</h2>
                    <p className="text-sm text-muted-foreground">Run models completely offline via Ollama.</p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ollama Base URL</label>
                        <Input
                            type="text"
                            placeholder="http://localhost:11434"
                            value={localOllamaUrl}
                            onChange={e => setLocalOllamaUrl(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold">Model Routing</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Default Model</label>
                        <Select value={localModel} onValueChange={setLocalModel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a default model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                                <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                                <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                                <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                                <SelectItem value="gemini-2.5-pro">Google Gemini 2.5 Pro</SelectItem>
                                <SelectItem value="gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                                <SelectItem value="qwen3:8b">Ollama: Qwen-3 (8b)</SelectItem>
                                <SelectItem value="qwen2.5:14b">Ollama: Qwen-2.5 (14b)</SelectItem>
                                <SelectItem value="phi3:mini">Ollama: Phi-3 (mini)</SelectItem>
                                <SelectItem value="llama3.1">Ollama: Llama 3.1</SelectItem>
                                <SelectItem value="qwen2.5-coder">Ollama: Qwen 2.5 Coder</SelectItem>
                                <SelectItem value="custom">Custom (Type below)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {localModel === "custom" && (
                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium">Custom Model Name</label>
                            <Input
                                type="text"
                                placeholder="deepseek-coder:6.7b or other"
                                value={customModel}
                                onChange={e => setCustomModel(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave} size="lg">
                        <Save className="size-4 mr-2" />
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
