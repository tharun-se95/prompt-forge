import { LLMProvider, LLMMessage, LLMGenerationOptions } from "./index";

export class ClaudeProvider implements LLMProvider {
    name = "Claude";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string> {
        if (!this.apiKey) throw new Error("Claude API key is missing");

        // Extract system message if present (Claude requires it at top-level)
        const systemMessage = messages.find(m => m.role === "system")?.content;
        const userMessages = messages.filter(m => m.role !== "system");

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true" // Required for client-side fetch, though Tauri allows bypassing CORS, Claude API checks headers
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
