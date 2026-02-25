import { LLMProvider, LLMMessage, LLMGenerationOptions } from "./index";
import { fetch } from "@tauri-apps/plugin-http";
import { useDebugStore } from "@/store/debug";

export class ClaudeProvider implements LLMProvider {
    name = "Claude";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string> {
        const { addLog } = useDebugStore.getState();
        if (!this.apiKey) throw new Error("Claude API key is missing");
        if (!options) throw new Error("Claude options are missing");

        addLog("Claude Request Started", "info", { model: options.model });

        // Extract system message if present (Claude requires it at top-level)
        const systemMessage = messages.find(m => m.role === "system")?.content;
        const userMessages = messages.filter(m => m.role !== "system");

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: options.model,
                system: systemMessage,
                messages: userMessages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 4096,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Claude API Error: ${error?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.content[0]?.text || "";
    }
}
