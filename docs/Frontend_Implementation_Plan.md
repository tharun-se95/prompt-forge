# Frontend Implementation Plan: PromptForge Form Enhancements

## 1. Overall Project Context & Technologies

*   **Core Stack:** React (TypeScript), Tailwind CSS, Radix UI, Lucide-React.
*   **State Management:** Zustand.
*   **Animations/Interactions:** `framer-motion`, `dnd-kit`.
*   **Backend Comm:** Tauri APIs (`@tauri-apps/plugin-store`, `invoke`).

## 2. General Implementation Guidelines & Best Practices

*   **Zustand Debouncing:** Ensure `useStore` hooks implement lodash `debounce` or custom timeout hooks before triggering Tauri saves to prevent disk thrashing.
*   **Accessibility (a11y):** Radix UI primitives handle most ARIA/focus requirements. For custom interactions (like drag-and-drop), ensure keyboard navigation is supported.
*   **Error Handling:** Use `sonner` toasts for `try/catch` blocks wrapping async Tauri invokes.
*   **Lazy Loading:** `useSnippetStore.loadSnippets()` should only be called inside the `useEffect` of the `SnippetSidebar` when its `open` state is `true`.

---

## 3. Feature-Specific Implementation Requirements

### 3.1 Context Snippet Library

*   **State Management:**
    ```typescript
    interface SnippetState {
      snippets: Snippet[];
      isLoaded: boolean;
      addSnippet: (payload: NewSnippetPayload) => Promise<void>;
      loadSnippets: () => Promise<void>;
      // delete, etc.
    }
    const useSnippetStore = create<SnippetState>((set, get) => ({ ... }));
    ```
*   **UI Components:**
    *   `SnippetSidebar.tsx`: Wraps a Radix `<Drawer.Root direction="right">`. Renders `SnippetCard`s.
    *   `ContextTextarea.tsx`: Enhanced default textarea. Adds a top-right `BookMarked` icon (Lucide) triggering the Drawer. Adds logic to capture highlighted text (`window.getSelection()`) and show a floating `(+)` button.
*   **Interaction Logic:**
    *   Clicking `(+)` opens a Radix `<Dialog>` asking for "Snippet Title".
    *   On confirm, `addSnippet` is dispatched. `sonner` toast confirms.
    *   Clicking a `SnippetCard` in the Drawer injects its `content` string into the `Context` at the cursor position (managing `ref.current.selectionStart`).

### 3.2 Dynamic Constraint Weighting (Priority Tags)

*   **State Management:** Extends `useBuilderStore` (No new state needed).
*   **Logic:**
    In `BuilderPage.tsx` compilation `useEffect`:
    ```typescript
    const parsedConstraints = constraints.split('\n').map(c => {
      const trimmed = c.trim();
      if (trimmed.startsWith('!')) return `<important_constraint>${trimmed.slice(1).trim()}</important_constraint>`;
      if (trimmed.startsWith('?')) return `<optional_style>${trimmed.slice(1).trim()}</optional_style>`;
      return trimmed;
    });
    ```
*   **UI Component:**
    *   `ConstraintsInput.tsx`: We overlay a syntax-highlighting `div` precisely behind a transparent `textarea` (standard trick for lightweight "code editors" without heavy libraries). Regex matches `^!.*` (Emerald-400 font-semibold) and `^\?.*` (Indigo-400 opacity-80 italic).

### 3.3 Output Schema Builder

*   **State Management:**
    ```typescript
    type SchemaField = { key: string, type: 'string' | 'number' | 'array', description: string };
    type OutputFormat = { mode: 'simple' | 'structured', raw?: string, schema?: SchemaField[] };
    ```
    Update `useBuilderStore` to handle `OutputFormat` instead of a plain string.
*   **UI Components:**
    *   `OutputFormatToggle.tsx`: Radix `<Tabs>` acting as a Segmented Control.
    *   `SchemaBuilder.tsx`: Renders the array of `SchemaField` objects.
    *   `SchemaRow.tsx`: A flex row containing 2 `<Input>` fields, 1 `<Select>`, and 1 Ghost Button (`Trash2`).
*   **Interaction Logic:**
    *   If keys duplicate, calculate validity: `const isDuplicate = schema.filter(f => f.key === currentKey).length > 1;`. Apply `border-red-500` to the specific input if true.

### 3.4 Prompt Version Branching (Iterative Stacks)

*   **State Management:**
    ```typescript
    interface BranchState {
      branches: Branch[];
      activeBranchId: string | null;
      createBranch: (name: string, currentState: BuilderState) => Promise<void>;
      switchBranch: (id: string, storeSetter: (s: BuilderState) => void) => Promise<void>;
    }
    ```
*   **UI Components:**
    *   `BranchTabBar.tsx`: Renders above the `InputStack`.
    *   `BranchTab.tsx`: Maps over `branches`. Uses `framer-motion` for `layoutId` to animate the active tab background (Indigo glow).
*   **Interaction Logic:**
    *   `switchBranch` must inject the target branch's `state` directly into the `useBuilderStore` via a setter callback, effectively re-hydrating the form instantly. 150ms cross-fade wrap around the form container using `AnimatePresence`.

### 3.5 Draggable Block Reordering

*   **State Management:** Add `blockOrder: string[]` to `useBuilderStore`.
*   **UI Components:**
    *   `ReorderModeToggle.tsx`: A prominent button in the main header setting a local `isReordering` boolean state.
    *   `DraggableBlock.tsx`: Wraps Goal, Context, Constraints. Hooks into `@dnd-kit/core`. Renders a `GripVertical` handle conditionally based on `isReordering`.
*   **Interaction Logic:**
    *   Use `dnd-kit`'s `SortableContext` and `useSortable`.
    *   On `handleDragEnd`, calculate new array index and dispatch `setBlockOrder(newOrder)` to `useBuilderStore`.
    *   The continuous compilation `useEffect` dynamically `map()`s over `blockOrder` to synthesize the prompt in real-time.

---

## 4. Integration & Consistency
*   **Sidebar Drawers:** Ensure `z-index` stacking contexts do not conflict between the existing `HistoryDrawer` and the new `SnippetDrawer`. Standardize backdrop opacity (e.g., `bg-black/40 backdrop-blur-sm`).
*   **Debounced Save Indicator:** At the bottom layout footprint, listen to all `isSaving` booleans from Zustand stores to show a unified "Saving..." or "Saved" checkmark.
