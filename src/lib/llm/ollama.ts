import { LLMProvider, LLMMessage, LLMGenerationOptions } from "./index";
import { fetch } from "@tauri-apps/plugin-http";

export class OllamaProvider implements LLMProvider {
    name = "Ollama";
    private baseUrl: string;

    constructor(baseUrl: string = "http://localhost:11434") {
        // Ensure no trailing slash
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    async generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: options.model,
                messages: messages,
                stream: true,
                options: {
                    temperature: options.temperature ?? 0.7,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API Error: ${errorText || response.statusText}`);
        }

        const reader = response.body?.getReader();
        // In @tauri-apps/plugin-http, stream reading might differ slightly but conforms to the standard web streams API.
        if (!reader) throw new Error("No response body from Ollama");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (data.message?.content) {
                        fullText += data.message.content;
                        if (options.onProgress) {
                            options.onProgress(data.message.content);
                        }
                    }
                } catch (e) {
                    // Ignore incomplete JSON chunks, they will be appended to the next read
                }
            }
        }

        return fullText;
    }
}
