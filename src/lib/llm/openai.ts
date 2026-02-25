import { LLMProvider, LLMMessage, LLMGenerationOptions } from "./index";
import { fetch } from "@tauri-apps/plugin-http";
import { useDebugStore } from "@/store/debug";

export class OpenAIProvider implements LLMProvider {
    name = "OpenAI";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string> {
        const { addLog } = useDebugStore.getState();
        if (!this.apiKey) throw new Error("OpenAI API key is missing");
        if (!options) throw new Error("OpenAI options are missing");

        addLog("OpenAI Request Started", "info", { model: options.model });

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: options.model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API Error: ${error?.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    }
}
