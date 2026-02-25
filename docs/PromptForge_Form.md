# PromptForge Form Component Documentation

The **PromptForge Form** is the core functional unit of the application, designed as a modular engineering system for crafting elite AI prompts. It follows a "Meta-Prompt Engineering" philosophy, where the user provides building blocks that are synthesized into a structured set of instructions for another AI.

## Overview

The form is primarily implemented within [BuilderPage.tsx](file:///Users/tharunk/Documents/AI%20clipboard/prompt-forge/src/pages/BuilderPage.tsx) and managed by the [useBuilderStore](file:///Users/tharunk/Documents/AI%20clipboard/prompt-forge/src/store/builder.ts). It facilitates a structured workflow for prompt generation across multiple LLM providers (OpenAI, Claude, Gemini, and Ollama).

---

## Key Features

- **Modular Synthesis**: Real-time compilation of prompt blocks into a unified system prompt.
- **Persona Integration**: One-click adoption of professional mindsets (e.g., Product Engineer, System Architect) that automatically inject specialized constraints and thinking styles.
- **Live Engine Preview**: A dedicated "Live Engine" column that shows the final compiled logic as it will be sent to the AI.
- **Typewriter Streaming**: Smooth, cinematic rendering of AI responses to improve readability during generation.
- **Dual-Mode Output**: Seamlessly toggle between **Markdown Preview** (visual) and **Manual Edit** (raw text) for the generated results.
- **Cross-Platform Persistence**: Integrates with Tauri's high-performance JSON store to persist input state across sessions.

---

## Inputs & Store Fields

The form state is handled by the `useBuilderStore` with the following core fields:

| Field | Input Component | Target Logic Block | Description |
| :--- | :--- | :--- | :--- |
| **Persona** | `Select` | `[SYSTEM ROLE]` | Selects a predefined expert mindset from `defaultPersonas`. |
| **Goal** | `Textarea` | `[GOAL]` | The primary objective or task the AI should perform. |
| **Context** | `Textarea` | `[CONTEXT]` | Background data, code snippets, or historical info (monospaced). |
| **Constraints** | `Textarea` | `[CONSTRAINTS]` | Line-by-line rules that the AI's output must follow. |
| **Output Format** | `Input` | `[OUTPUT FORMAT]` | Specific layout requirements (e.g., "JSON", "Markdown Table"). |

---

## UI Components

The form leverages a premium design system built with Radix UI primitives and Tailwind CSS.

### 1. The Input Stack (Left Column)
- **Select**: Used for Persona selection with glassmorphic dropdowns.
- **Textarea**: High-performance input areas with specific styling for Goal (base text), Context (monospaced), and Constraints.
- **Button (Craft Prompt)**: The primary action trigger with "Premium Glow" aesthetics and loading states.

### 2. Live Engine Synthesis (Center Column)
- **ScrollArea**: A real-time preview of the `compiledPrompt`.
- **Active Synthesis Indicator**: A pulsing status light indicating the engine is ready or processing.
- **Copy Trigger**: Quick-action button to copy the compiled logic without generating.

### 3. Output Control Area (Right Column)
- **Toolbar**: Contains stats (word/char counts) and action buttons:
  - **Save**: Manually records the result to `HistoryStore`.
  - **Copy/Check**: Copying responses with visual feedback.
  - **Toggle (Preview/Edit)**: Switches between `ReactMarkdown` rendering and raw `Textarea` editing.
  - **Clear**: Resets the current output state.

---

## Logic Flow

1. **State Update**: User types into any input field, updating the `Zustand` store.
2. **Compilation**: A `useEffect` hook in `BuilderPage` watches the store and rebuilds the `compiledPrompt` string centrally.
3. **Generation**: `handleGenerate` builds a structured `messages` array, selects the appropriate `LLMProvider`, and streams the response.
4. **Finalization**: The result is saved to the local `lastResult` state and appended to the `HistoryStore`.
