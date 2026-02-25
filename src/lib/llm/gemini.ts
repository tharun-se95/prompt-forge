import { LLMProvider, LLMMessage, LLMGenerationOptions } from "./index";
import { fetch } from "@tauri-apps/plugin-http";
import { useDebugStore } from "@/store/debug";

export class GeminiProvider implements LLMProvider {
    name = "Gemini";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string> {
        const { addLog } = useDebugStore.getState();
        if (!this.apiKey) throw new Error("Gemini API key is missing");
        if (!options) throw new Error("Gemini options are missing");

        addLog("Gemini Request Started", "info", { model: options.model, messageCount: messages?.length });

        // Extract system message for system_instruction if available
        const systemMessage = messages.find(m => m.role === "system")?.content;

        // Filter and ensure alternating roles (user/model)
        // Gemini requires the conversation to start with 'user' and alternate.
        const userMessages = messages.filter(m => m.role !== "system");
        const geminiMessages: any[] = [];

        userMessages.forEach((msg) => {
            const role = msg.role === "assistant" ? "model" : "user";

            // If the last message has the same role, Gemini will fail. 
            // In a simple builder, this usually doesn't happen, but we should be robust.
            if (geminiMessages.length > 0 && geminiMessages[geminiMessages.length - 1].role === role) {
                // Merge content or handle accordingly. For now, we skip or merge.
                geminiMessages[geminiMessages.length - 1].parts[0].text += "\n" + msg.content;
            } else {
                geminiMessages.push({
                    role,
                    parts: [{ text: msg.content }]
                });
            }
        });

        // Ensure we start with 'user'
        if (geminiMessages.length > 0 && geminiMessages[0].role === "model") {
            geminiMessages.shift();
        }

        const body: any = {
            contents: geminiMessages,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 4096,
            }
        };

        if (systemMessage) {
            body.system_instruction = {
                parts: [{ text: systemMessage }]
            };
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Gemini API Error: ${response.statusText}`;

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (e) {
                // Not JSON, use raw text if available
                if (errorText) errorMessage = errorText;
            }

            addLog("Gemini API Error", "error", { status: response.status, error: errorText });
            throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body from Gemini");

        const decoder = new TextDecoder();
        let fullText = "";
        let lineBuffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            lineBuffer += chunk;

            const lines = lineBuffer.split("\n");
            // The last item in the split might be an incomplete line, 
            // so we keep it in the buffer for the next iteration.
            lineBuffer = lines.pop() || "";

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
