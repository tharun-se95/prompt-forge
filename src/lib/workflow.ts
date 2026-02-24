import { useSettingsStore } from "@/store/settings";
import { usePersonasStore } from "@/store/personas";
import { OpenAIProvider } from "./llm/openai";
import { ClaudeProvider } from "./llm/claude";
import { OllamaProvider } from "./llm/ollama";
import { GeminiProvider } from "./llm/gemini";

export interface WorkflowNode {
    id: string;
    personaId: string;
    goal: string;
    outputFormat?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
}

export async function executeWorkflow(
    workflow: Workflow,
    initialContext: string,
    onProgress: (stepIdx: number, result: string, nodeName: string) => void
) {
    const { openAiKey, claudeKey, geminiKey, ollamaUrl, defaultModel } = useSettingsStore.getState();
    const { personas } = usePersonasStore.getState();

    let currentContext = initialContext;

    for (let i = 0; i < workflow.nodes.length; i++) {
        const node = workflow.nodes[i];
        const persona = personas.find(p => p.id === node.personaId);

        let prompt = "";
        if (persona) {
            prompt += `## Role: ${persona.name}\n${persona.mindset}\n\n`;
            prompt += `## Thinking Style\n${persona.thinkingStyle}\n\n`;
        }

        if (node.goal) prompt += `## Goal\n${node.goal}\n\n`;
        prompt += `## Input/Context\n${currentContext}\n\n`;

        if (node.outputFormat || persona?.outputFormat) {
            prompt += `## Output Format required\n${node.outputFormat || persona?.outputFormat}\n\n`;
        }

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

        const result = await provider.generate([{ role: "user", content: prompt.trim() }], { model: defaultModel, maxTokens: 4096 });

        onProgress(i, result, persona?.name || node.id);
        currentContext = result; // Pass result to next node as context
    }

    return currentContext;
}
