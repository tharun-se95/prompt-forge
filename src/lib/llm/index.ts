export interface LLMMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface LLMGenerationOptions {
    model: string;
    temperature?: number;
    maxTokens?: number;
    onProgress?: (chunk: string) => void;
}

export interface LLMProvider {
    name: string;
    generate(messages: LLMMessage[], options: LLMGenerationOptions): Promise<string>;
}
