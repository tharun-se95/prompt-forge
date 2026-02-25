# UI/UX Design Specification: PromptForge Form Enhancements

## 1. Overall Design Vision & Guiding Principles

PromptForge aims to be the "IDE for Prompt Engineering"—a space where creative intent meets engineering precision. The design philosophy is **"Adaptively Expansive"**: the interface should feel simple for beginners but reveal powerful, "premium" tools as the user's complexity grows.

### General Guidelines
*   **Typography:** Primary font is **Outfit** (Geometric Sans-serif) for headings and **Inter** for UI labels. **JetBrains Mono** or **Fira Code** is used for all code/prompt blocks.
*   **Color Palette:**
    *   **Primary/Accent:** Indigo-500 (#6366f1) and Violet-600.
    *   **Neutral:** Slate-900 (Background), Slate-800/700 (Cards/Borders).
    *   **Success:** Emerald-500. **Error:** Rose-500.
*   **Spacing Units:** Consistent 4px grid (Gap-1: 4px, Gap-4: 16px, Gap-6: 24px).
*   **Aesthetic:** Glassmorphism, subtle gradients, and high-contrast borders (1px border-white/5).

---

## 2. Feature: Context Snippet Library (Knowledge Base)

### 2.1. User Story & Goal
As a power user, I want to store and quickly inject recurring background data (code snippets, project specs) into the Context box so I don't have to manually copy-paste from external files every time.

### 2.2. Key UI Elements & Layout
*   **Snippet Icon Button:** A small `Library` or `Book` icon placed in the top-right header of the Context textarea.
*   **Snippet Sidebar (Radix UI Drawer):** A drawer that slides in from the right, overlaying the "Generated Prompt" column temporarily.
*   **Snippet Cards:** List items within the drawer showing the snippet title and a 2-line preview.
*   **Floating "Save" UI:** A small (+) button that appears near the text cursor if text is selected within the Context box.

### 2.3. Interaction Flows & User Journey
1.  **Saving:** User selects text in Context -> Floating (+) appear -> User clicks -> A small modal asks for "Snippet Title" -> Saved.
2.  **Inserting:** User clicks Snippet Icon -> Sidebar opens -> User clicks a Snippet Card -> Content is appended to the Context textarea at the cursor position.
3.  **Primary CTA:** The **Insert** action on the card (represented by the card's hover state or a "plus" icon).

### 2.4. Visual Design Details
*   **Typography:** Titles are 13px Semi-bold; Multi-line previews are 11px Regular with `leading-relaxed`.
*   **Spacing:** Padding inside the drawer is 24px; Cards are separated by 12px gaps.
*   **Iconography:** `Lucide-React`'s `BookMarked` for the icon; `Plus` for saving; `Trash2` for management.

### 2.5. States & Feedback Mechanisms
*   **Empty State:** "No snippets yet. Highlight text in the Context box to create your first knowledge block."
*   **Hover State:** Card background shifts from `transparent` to `white/5` with a subtle Indigo border.
*   **Success Feedback:** `sonner` toast: "Snippet 'Project Alpha Spec' saved to library."

### 2.6. Micro-interactions & Animations
*   **Slide-In:** Sidebar uses a `spring` transition (duration: 300ms, damping: 20) for a natural feel.
*   **Flash Insert:** When a snippet is inserted, the Context textarea briefly glows with a faint Indigo border to confirm input.

### 2.7. Accessibility Notes
*   Ensure the Drawer component manages focus correctly (traps focus when open, restores when closed).
*   Snippet Cards must be focusable via `Tab` and triggers "Insert" via `Enter`.

---

## 3. Feature: Dynamic Constraint Weighting (Priority Tags)

### 3.1. User Story & Goal
As a prompt engineer, I want to tell the AI which constraints are non-negotiable versus just stylistic suggestions, so the output more closely follows my "intent hierarchy."

### 3.2. Key UI Elements & Layout
*   **Inline Syntax Highlighting:** Not a separate component, but a stylistic override within the Constraints `Textarea`.
*   **Legend Indicator:** A small, dimmed hint text below the textarea: `! = Critical | ? = Optional`.

### 3.3. Interaction Flows & User Journey
1.  User types `! No outside libraries` on a new line.
2.  The UI instantly highlights the `!` in Emerald (Success) and the text in Bold.
3.  User types `? Add emojis` on a new line.
4.  The UI highlights the `?` in Amber/Violet and the text in Italic/Dimmed.

### 3.4. Visual Design Details
*   **Colors:** `!` uses `Emerald-400`; `?` uses `Indigo-400`.
*   **Typography:** Monospaced (JetBrains Mono). Text following `!` is Semi-bold; text following `?` is 80% opacity and Italic.

### 3.5. States & Feedback Mechanisms
*   **Visual Validation:** The transformation happens in real-time. If the syntax is correct, the color shifts immediately.
*   **Error State:** If `!` is used but no text follows, the symbol turns red temporarily.

---

## 4. Feature: Output Schema Builder

### 4.1. User Story & Goal
As a developer, I want to define a strict JSON structure for the AI's response so my application can consistently parse and display the data without "hallucinated" keys.

### 4.2. Key UI Elements & Layout
*   **Structured Toggle:** A Segmented Control (Simple vs. Structured) replacing the current Output Format input.
*   **Field Row Component:** A horizontal set of inputs: `Field Name (Input)`, `Type (Select)`, `Description (Input)`, `Delete (Icon)`.
*   **Add Field Button:** A ghost button at the bottom of the list.

### 4.3. Interaction Flows & User Journey
1.  User toggles to "Structured".
2.  Rows appear. User adds "title" (Type: String), "priority" (Type: Number).
3.  The "Live Engine" column updates to show a JSON Schema instruction block being injected into the system prompt.

### 4.4. Visual Design Details
*   **Layout:** Grid-based rows: `key (40%) | type (20%) | desc (30%) | actions (10%)`.
*   **Typography:** Input text is 12px; Labels are 10px Bold all-caps.

### 4.5. States & Feedback Mechanisms
*   **Validation:** If duplicate keys are entered, the key input gets a Rose-500 border.
*   **Empty State:** Initial state provides one empty row by default.

---

## 5. Feature: Prompt Version Branching (Iterative Stacks)

### 5.1. User Story & Goal
As an iterative engineer, I want to branch my prompt to test small changes without losing my "baseline" version, allowing for rapid A/B testing of prompt strategies.

### 5.2. Key UI Elements & Layout
*   **Branch Tab Bar:** Located at the absolute top of the Input Column (Left Column).
*   **Branch Tab:** Small, pill-shaped tabs with "Branch name" and an (x) to close.
*   **New Branch Button:** A (+) icon at the end of the tab bar.

### 5.3. Interaction Flows & User Journey
1.  User clicks (+).
2.  Action: A new tab "Branch 2" appears. All current inputs (Goal, Context, etc.) are cloned into it.
3.  User modifies Branch 2.
4.  User clicks "Branch 1" tab to swap back to the previous state instantly.

### 5.4. Visual Design Details
*   **Active Tab:** Indigo background with White text and a subtle glow.
*   **Inactive Tab:** Slate-800 background, dimmed text, hover effect to Slate-700.
*   **Transition:** Cross-fade animation (150ms) when switching tabs to reduce visual jarring.

---

## 6. Feature: Draggable Block Reordering

### 6.1. User Story & Goal
As a power user, I want to change the order of prompt blocks because different LLMs respond better to certain sequence patterns (e.g., putting constraints at the very end).

### 6.2. Key UI Elements & Layout
*   **Drag Handles:** A 6-dot vertical handle (`GripVertical`) appearing to the left of each section header (Goal, Context, Constraints, etc.).
*   **Reorder Mode Toggle:** A small gear or icon in the header to "Edit Layout."

### 6.3. Interaction Flows & User Journey
1.  User enters "Edit Layout" mode.
2.  Handles become visible.
3.  User drags "Constraints" block above "Goal."
4.  The entire UI column reorders, and the "Live Engine" updates the compilation sequence.

### 6.4. Micro-interactions & Animations
*   **Lift Effect:** On drag start, the block scales to 1.02x and gains a `shadow-2xl` with a blur backdrop.
*   **Swap Animation:** Surrounding blocks slide smoothly into their new positions using `framer-motion` layout animations.

---

## 7. Integration & Consistency across Features
The enhancements are integrated as follows:
*   **Vertical Consistency:** All sidebars/drawers use the same Radix UI `Drawer` primitives.
*   **Icon Library:** Strictly using `Lucide-React` with a stroke width of 1.75.
*   **Persistence:** Every change triggers a debounced "Saving..." indicator in the footer for peace of mind.

## 8. Recommended Next Steps (UI/UX Perspective)
1.  **Motion Prototype:** Create a High-Fidelity prototype of the "Draggable Reordering" to ensure it doesn't feel sluggish.
2.  **Constraint Feedback:** Test the "Priority Highlighting" with real users to see if the chosen colors (`Emerald` vs. `Amber`) are intuitive for weight.
