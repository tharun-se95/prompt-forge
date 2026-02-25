# Backend Implementation Plan: PromptForge Form Enhancements

## 1. General Backend Requirements & Considerations

### 1.1 Strict Data Validation
*   **Rust-Level Validation:** All incoming data payloads from the frontend (React) to Tauri commands must be strictly validated. We will use Rust's powerful type system (Structs) and `serde` for deserialization to ensure structural integrity.
*   **Semantic Validation:** Beyond structural types, we must validate semantic correctness (e.g., ensuring `id` is a valid UUID, `title` is not empty, `tags` list contains valid strings without illegal characters).
*   **Persistence Boundary:** Validation occurs immediately upon entering the Tauri command, *before* any interaction with `@tauri-apps/plugin-store`.

### 1.2 Graceful Error Handling
*   **Result Pattern:** All Tauri commands performing file operations or logic will return `Result<T, CustomError>`.
*   **Custom Error Enum:** We will define a `PromptForgeError` enum in Rust encapsulating different failure states (e.g., `IoError`, `ValidationError`, `StoreError`). This enum will implement `serde::Serialize` to pass structured error objects to the frontend.
*   **Safe Defaults:** When loading stores using `@tauri-apps/plugin-store`, we will provide safe default values (e.g., `{ "snippets": [] }`). If a file is fatally corrupted, the system will initialize with these defaults rather than crashing, while logging the corruption event.

### 1.3 Optimized Persistence Operations & Schema Explanation
*   **Debouncing:** While `@tauri-apps/plugin-store` offers `autoSave`, we will manage saves manually for high-frequency updates (like typing). The frontend will debounce updates to persistent Zustand stores before triggering the Tauri save command.
*   **Lazy Loading:** Peripheral stores like `snippets.json` will not load on application startup. Instead, the `load_snippets()` command will be invoked only when the Snippet Drawer is first opened.

### 1.4 Scalability & Statelessness
*   **File Modularity:** We avoid a single monolithic `state.json`. `builder.json`, `snippets.json`, and `branches.json` separate concerns and keep file sizes small.
*   **Stateless Commands:** Tauri commands should act purely on provided inputs or directly interact with the persistent store without maintaining memory state across invocations (except what `@tauri-apps/plugin-store` manages internally).

### 1.5 Configuration Management
*   **Settings Store:** `settings.json` via `@tauri-apps/plugin-store` will manage application-wide preferences.
*   **New Settings:** Add `reorderModeEnabled: boolean` to the configuration schema.

---

## 2. Feature-Specific Backend Implementation Plan

### 2.1 Context Snippet Library (Knowledge Base)

*   **Data Model (TypeScript Interface & JSON Schema):**
    ```typescript
    interface Snippet {
      id: string; // UUID v4
      title: string;
      content: string;
      tags: string[]; 
      updatedAt: string; // ISO8601
    }
    interface SnippetStore {
        snippets: Snippet[];
    }
    ```
    *JSON Schema*: `snippets.json` containing an array of `Snippet` objects.

*   **Persistence Strategy:**
    *   **File:** `snippets.json`.
    *   **Operations:** `@tauri-apps/plugin-store` manages CRUD. `load` with `{ snippets: [] }` default.

*   **Tauri Command Design:**
    ```rust
    // Conceptually
    #[tauri::command]
    fn load_snippets() -> Result<SnippetStore, PromptForgeError>;

    #[tauri::command]
    fn add_snippet(new_snippet: NewSnippetPayload) -> Result<Snippet, PromptForgeError>;

    #[tauri::command]
    fn update_snippet(snippet: Snippet) -> Result<Snippet, PromptForgeError>;

    #[tauri::command]
    fn delete_snippet(id: String) -> Result<(), PromptForgeError>;
    ```

*   **Architectural Justifications:** Decoupling snippets from `builder.json` prevents the main builder state from becoming bloated. The plugin-store provides a fast, local JSON Key-Value store perfectly suited for this schema.
*   **SPOF & Mitigations:** `snippets.json` corruption. *Mitigation:* The `load_snippets` command gracefully handles parsing errors by returning an empty store and logging a warning. Provide a "Reset Snippets" utility in settings if corruption is caught.

### 2.2 Dynamic Constraint Weighting (Priority Tags)

*   **Data Model:** No changes to persistent models. `constraints` remains a string.
*   **Persistence Strategy:** Handled as part of the existing `builder.json` state.
*   **Tauri Command Design:** No new commands.
*   **Architectural Justifications:** Keeping this as a functional, regex-based transformation during prompt compilation ensures zero backend overhead and maintains a stateless pipeline.

### 2.3 Output Schema Builder

*   **Data Model:**
    ```typescript
    type SchemaFieldType = 'string' | 'number' | 'array' | 'boolean' | 'object' | 'null';
    interface SchemaField {
      key: string;
      type: SchemaFieldType;
      description: string;
      required: boolean;
    }
    interface OutputFormat {
      mode: 'simple' | 'structured';
      raw?: string;
      schema?: SchemaField[];
    }
    ```
*   **Persistence Strategy:**
    *   **Location:** Integrated into the existing `BuilderState` within `builder.json`.
    *   **Validation:** During the `save_builder_state` command, the Rust backend must validate the `OutputFormat` object, ensuring keys are unique and types are valid.

*   **Tauri Command Design:**
    Modifying the existing `save_builder_state` command to type-check `OutputFormat`.
    ```rust
    #[tauri::command]
    fn save_builder_state(state: BuilderStatePayload) -> Result<(), PromptForgeError>;
    ```

*   **Architectural Justifications:** Integrating into the existing builder state ensures that saving a prompt configuration captures the schema holistically alongside constraints and context.

### 2.4 Prompt Version Branching (Iterative Stacks)

*   **Data Model:**
    ```typescript
    interface Branch {
      id: string; // UUID
      name: string;
      createdAt: string; // ISO8601
      lastModified: string; // ISO8601
      state: BuilderState; // Deep copy of the builder state
    }
    interface BranchStore {
        branches: Branch[];
        activeBranchId: string | null;
    }
    ```
*   **Persistence Strategy:**
    *   **File:** `branches.json`.
    *   **Operations:** Handled via plugin-store. Creation deep-copies `BuilderState`. Switching updates `activeBranchId`.

*   **Tauri Command Design:**
    ```rust
    #[tauri::command]
    fn load_branches() -> Result<BranchStore, PromptForgeError>;

    #[tauri::command]
    fn create_branch(name: String, state: BuilderState) -> Result<Branch, PromptForgeError>;

    #[tauri::command]
    fn switch_branch(id: String) -> Result<BuilderState, PromptForgeError>;

    #[tauri::command]
    fn delete_branch(id: String) -> Result<(), PromptForgeError>;
    
    #[tauri::command]
    fn update_active_branch_state(state: BuilderState) -> Result<(), PromptForgeError>;
    ```

*   **Architectural Justifications:** Independent persistent file `branches.json` isolates version control logic from active session logic.
*   **SPOF & Mitigations:** Excessive memory/disk utilization by branching indefinitely. *Mitigation:* Implement a hard limit in the Rust layer validating that no more than 10 branches can exist simultaneously. Attempting to create an 11th returns a specific `BranchLimitReached` error.

### 2.5 Draggable Block Reordering

*   **Data Model:** Add `blockOrder: string[]` to the existing `BuilderState`.
*   **Persistence Strategy:** Modifying `builder.json` schema. Update `save_builder_state`.
*   **Backward Compatibility:** Rust logic must account for `blockOrder` being missing in older `builder.json` files by injecting a default payload `["goal", "context", "constraints", "outputFormat"]` during load.

---

## 3. Recommended Next Steps (Backend)

1.  **Rust Command Implementation:** Scaffold the new Rust files (e.g., `commands/snippets.rs`, `commands/branches.rs`) and wire them to Tauri `invoke_handler`.
2.  **PromptCompiler Rust Extraction (SPIKE):** Refactor the prompt compilation string manipulation from React to a pure Rust function accessible via an `invoke("compile_prompt")` command for higher reliability and testability.
