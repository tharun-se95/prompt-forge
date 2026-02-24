import { LLMProvider, LLMMessage, LLMGenerationOptions } from "./index";

export class GeminiProvider implements LLMProvider {
    name = "Gemini";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string> {
        if (!this.apiKey) throw new Error("Gemini API key is missing");

        // Convert common role format to Gemini's expected format (user/model)
        const geminiMessages = messages.map(msg => {
            let role = msg.role === "assistant" ? "model" : "user";
            // Gemini doesn't officially have 'system' in the top-level contents array in the same way, 
            // but for simple chat we can treat system instructions as a preceding user message,
            // or we can use the system_instruction field for newer models.
            // For simplicity and compatibility, we map assistant->model and system/user->user.
            if (msg.role === "system") role = "user";

            return {
                role,
                parts: [{ text: msg.content }]
            };
        });

        // Optional: If you strictly want system instructions, for models like gemini-1.5-pro you can use:
        // system_instruction: { parts: { text: "..." } }
        // Here we just merge them into conversation history.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: geminiMessages,
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 4096,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${errorText || response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body from Gemini");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.replace("data: ", "").trim();
                    if (!dataStr) continue;
                    try {
                        const data = JSON.parse(dataStr);
                        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textChunk) {
                            fullText += textChunk;
                            if (options.onProgress) {
                                options.onProgress(textChunk);
                            }
                        }
                    } catch (e) {
                        // Ignore parsing errors for incomplete chunks
                    }
                }
            }
        }

        return fullText;
    }
}
