## System Architecture & Implementation Plan: PromptForge Form Enhancements

### 1. Overall Architecture Vision & High-Level Design

*   **Current System Overview (Revisited):**
    PromptForge is a local-first desktop application built with **Tauri (Rust)** for its core and **React (TypeScript)** for the UI. State management is primarily handled by **Zustand**, and persistence is achieved using `@tauri-apps/plugin-store`. The new features will extend this architecture by introducing new specialized stores and enhancing the existing prompt compilation engine.

*   **Core Architectural Principles:**
    *   **Modular Persistence:** Each new entity (Snippets, Branches, etc.) will have its own persistent JSON store to avoid large, monolithic state files.
    *   **Stateless Compilation:** The prompt compilation logic will remain a functional transformation of the current state, ensuring predictability and easier testing.
    *   **Type-Safe Contracts:** All interactions between the UI, Zustand, and the Tauri storage layer will be strictly typed via TypeScript interfaces and validated during compilation.

*   **High-Level Component Diagram (Textual Description):**
    1.  **UI Layer (React):** Modular components for each input field (Goal, Context, Constraints).
    2.  **State Management (Zustand):** Individual stores (`useBuilderStore`, `useSnippetStore`, `useBranchStore`) coordinating local session state.
    3.  **Persistence Layer (Tauri Store):** Asynchronous sync to local filesystem (`builder.json`, `snippets.json`).
    4.  **Prompt Engine:** A pure function within `BuilderPage` (later to be extracted) that assembles blocks based on `blockOrder` and `tagWeighting`.

### 2. Common Architectural Considerations

*   **Error Handling Strategy:**
    *   **Resilient Loading:** All `load()` operations from Tauri include `defaults: {}` to ensure the app doesn't crash on corrupted or missing files.
    *   **User Feedback:** Logic-level errors (e.g., failed to save snippet) will be bubbled up to the UI via `sonner` toasts.
*   **Data Migration Strategy:**
    *   Minimalist approach: Use optional fields and default values in TypeScript interfaces to handle schema transformations as features evolve.
*   **Configuration Management:**
    *   Stored in `settings.json` via `useSettingsStore`. New settings for "Block Reordering Mode" will be added here.
*   **Performance Considerations:**
    *   **Debounced Saving:** Tauri store writes and JSON stringification will be debounced during heavy typing to minimize disk I/O.
    *   **Lazy Store Hydration:** Stores like `snippets.json` will only be loaded when the user interacts with the Context Sidebar.

---

### 3. Feature-Specific Implementation Plans

#### Feature Name: Context Snippet Library (Knowledge Base)

*   **Architectural Overview:**
    Fits as a peripheral data source for the `Context` input. It introduces a new `useSnippetStore` that interacts with a `snippets.json` file.
*   **UI/UX Considerations:**
    - **SnippetDrawer:** A Radix UI based drawer on the right side of the screen.
    - **QuickActions:** "Save as Snippet" floating button inside the Context Textarea when text is selected.
*   **Front-end Development (Tauri/Zustand):**
    *   **Zustand State Management:**
        - **Store:** `useSnippetStore`
        - **State:** `snippets: Snippet[]`, `isLoaded: boolean`
        - **Actions:** `addSnippet`, `deleteSnippet`, `loadSnippets`
    *   **UI Components:** `SnippetSidebar`, `SnippetCard`, `SnippetTriggerIcon`.
*   **Backend Development (Tauri/Local Logic):**
    *   **Data Models/Schemas:**
        ```json
        {
          "snippets": [
            { "id": "uuid", "title": "string", "content": "string", "tags": "string[]", "updatedAt": "ISO8601" }
          ]
        }
        ```
    *   **Tauri Commands:** Primary use of `@tauri-apps/plugin-store` for zero-boilerplate local CRUD.
*   **Architectural Justifications:**
    - **Tauri Store vs SQLite:** Store API is faster for small-to-medium JSON blobs and provides easier human-readable backups.
*   **Potential Single Points of Failure & Mitigations:**
    - **SPOF:** File corruption. **Mitigation:** Wrap load logic in try/catch and provide a "Clear/Reset" option in settings.

#### Feature Name: Dynamic Constraint Weighting (Priority Tags)

*   **Architectural Overview:**
    Integrates directly into the `Prompt Compilation Engine`. It requires a custom parser to detect `!` and `?` prefixes.
*   **Front-end Development (Tauri/Zustand):**
    *   **Zustand State Management:** No new store needed; existing `constraints` string in `useBuilderStore` is sufficient.
    *   **Interaction Logic:** A regex-based parser inside the prompt compilation `useEffect`.
*   **Logic Schema:**
    - `!Constraint` -> `<important_constraint>Constraint</important_constraint>`
    - `?Constraint` -> `<optional_style>Constraint</optional_style>`
    - Target LLMs (Claude/GPT-4) respond significantly better to XML-tagged emphasis.
*   **Architectural Justifications:** Use of XML tags over Bold/Markdown as instructions within system prompts are more robustly followed by instruction-tuned models.

#### Feature Name: Output Schema Builder

*   **Architectural Overview:**
    Transforms the `outputFormat` field from a simple string into a complex object.
*   **Front-end Development (Tauri/Zustand):**
    *   **State Shape:** 
        ```typescript
        type SchemaField = { key: string, type: 'string' | 'number' | 'array', description: string };
        type OutputFormat = { mode: 'simple' | 'structured', raw?: string, schema?: SchemaField[] };
        ```
*   **Logic Flow:**
    - If `mode === 'structured'`, the compiler generates a string: `Output the result as a JSON object with the following schema: { "key": "description", ... }`.
*   **Architectural Justifications:** Prevents AI "hallucinations" of keys that don't exist in the user's downstream parsing pipeline.

#### Feature Name: Prompt Version Branching (Iterative Stacks)

*   **Architectural Overview:**
    Introduces a "Stack" of `BuilderState` snapshots.
*   **Zustand State Management:**
    - **Store:** `useBranchStore`
    - **State:** `branches: BuilderState[]`, `activeBranchId: string`
    - **Actions:** `createBranch`, `switchBranch`, `mergeBranch`.
*   **Data Storage Strategy:** Persisted in `branches.json`. Snapshot captures Goal, Context, Constraints, and Output Format.
*   **SPOF:** Large branching depth consuming memory. **Mitigation:** Limit to 5 active branches per session.

#### Feature Name: Draggable Block Reordering

*   **Architectural Overview:**
    Adds a `blockOrder: string[]` field to the `useBuilderStore`.
*   **Interaction Logic:**
    - Integrate `dnd-kit` for smooth dragging of input sections.
    - Compilation logic: `blockOrder.map(blockKey => renderBlock(blockKey)).join('\n\n')`.
*   **Architectural Justifications:** Decouples the UI display order from the logical prompt order, allowing experts to experiment with attention mechanisms in LLMs.

---

### 4. Integration Plan

*   **Phased Rollout:**
    1.  **Phase 1 (Data):** Context Snippets & Priority Tags (Quickest to value).
    2.  **Phase 2 (Logic):** Reordering & Schema Builder.
    3.  **Phase 3 (Optimization):** Version Branching.
*   **Backward Compatibility:** Mapping the old string `outputFormat` to `OutputFormat.raw` in the new structured state to ensure existing data is preserved.

### 5. Out of Scope Confirmation
Confirmed: No multi-user sync, no image gen, and no external plugin API for this release.

### 6. Recommended Next Steps (Architectural Perspective)
1.  **Refactor:** Extract the prompt compilation logic from `BuilderPage.tsx` into a standalone `PromptCompiler` utility class for easier unit testing.
2.  **Schema SPIKE:** Test the **Output Schema Builder** output with at least 3 models (Ollama/Llama3, Claude 3.5 Sonnet, GPT-4o) to find the most universal instruction format.
