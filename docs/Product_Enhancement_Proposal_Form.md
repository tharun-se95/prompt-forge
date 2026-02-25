## Product Enhancement Proposal: PromptForge Form

### Executive Summary
This proposal outlines a strategic roadmap to evolve the **PromptForge Form** from a static input interface into a high-performance, modular workbench for Meta-Prompt Engineering. By introducing specialized management for Context, Constraints, and Output Formats, we aim to reduce user friction by **30-40%** and significantly increase the "Prompt Success Rate" (the likelihood of a result working on the first try). The focus is on **modular intelligence**—giving users elite tools to build, weight, and reuse prompt components.

### Guiding Principles
*   **User Value & Engagement:** Prioritizing features that eliminate repetitive work (snippets) and improve output accuracy (structured schemas).
*   **MVP-First & Iterative:** Each enhancement starts with a core UI addition that leverages existing `Zustand` and `Tauri` infrastructure for rapid deployment.
*   **Measurable Success:** Defined by concrete metrics such as feature adoption rates, frequency of use, and session-over-session retention.
*   **Modularity & Customization:** Strengthening the "building block" philosophy by allowing users to treat prompt components as persistent, weighted objects.

---

### Proposed Enhancements

#### Feature Category: Input Enhancements

##### Feature Name: Context Snippet Library (Knowledge Base)
**Problem:** Users frequently copy-paste the same background information, codebase summaries, or documentation blocks into the `Context` textarea across different sessions. This is manual, error-prone, and repetitive.
**Proposed Solution (MVP Scope):**
- Add a "Snippets" icon next to the Context label.
- Clicking it opens a small side-drawer containing a list of saved text blocks.
- Users can "Save as Snippet" from the current context or "Insert Snippet" into the existing text.
- Metadata: Snippets are stored in a new `snippets.json` using Tauri's store.
**User Value & Engagement Impact:** Reduces "time-to-generate" for returning users and encourages the creation of a persistent "Prompt Knowledge Base."
**Success Metrics:**
- **Adoption:** >25% of active users save at least one snippet within the first week.
- **Efficiency:** Average time spent in the BuilderPage decreases for users with >3 snippets.

##### Feature Name: Dynamic Constraint Weighting (Priority Tags)
**Problem:** LLMs often ignore specific constraints if they are buried in a long list. Currently, all constraints are treated as equal string entries, providing no "intent hierarchy" for the AI.
**Proposed Solution (MVP Scope):**
- Allow users to prefix constraints with `!` (CRITICAL) or `?` (OPTIONAL) in the textarea.
- The `compiledPrompt` logic will wrap `!CRITICAL` items in bold or XML tags like `<critical_instruction>` and `?OPTIONAL` items in `<suggested_style>`.
- Visual cues (slight color shifts) for these prefixes in the monospaced textarea.
**User Value & Engagement Impact:** Gives users more control over the "strictness" of their prompts, a key requirement for professional Meta-Prompting.
**Success Metrics:**
- **Quality:** Decrease in user reports of "AI ignored my constraint."
- **Usage:** Percentage of prompts generated using at least one critical/optional tag.

##### Feature Name: Output Schema Builder
**Problem:** The current "Output Format" is a single string input. While flexible, it often results in vague instructions (e.g., "JSON") that don't specify the keys, leading to inconsistent AI parsers.
**Proposed Solution (MVP Scope):**
- Replace the single `Input` with a "Simple/Structured" toggle.
- "Structured" mode provides a mini-form: `[Field Name] | [Type] | [Description]`.
- This compiles into a clear JSON Schema or Markdown Table template in the final system prompt.
**User Value & Engagement Impact:** Dramatically improves the reliability of the AI's output for developers who need to parse the results programmatically.
**Success Metrics:**
- **Reliability:** 50% fewer "Manual Edit" corrections to the output format in the 3rd column.
- **Conversion:** Users switching from "Simple" to "Structured" mode for technical personas.

---

#### Feature Category: New Core Features

##### Feature Name: Prompt Version Branching (Iterative Stacks)
**Problem:** When a user tweaks a prompt and regenerates, the previous version of the *inputs* is lost (overwritten in the store) unless they find it in the history. There is no way to quickly "undo" a prompt change.
**Proposed Solution (MVP Scope):**
- Add "Branch" button to the Input column.
- Clicking "Branch" creates a temporary duplicate of the current inputs in a new store tab.
- Users can switch between "Branch A" and "Branch B" to compare how small changes in Goal or Constraints affect the result.
**User Value & Engagement Impact:** Encourages experimentation and the "Scientific Method" of prompt engineering.
**Future Iterations/Considerations:** Side-by-side comparison of results for Branch A vs. Branch B.

---

#### Feature Category: Customization & Extensibility

##### Feature Name: Draggable Block Reordering
**Problem:** Currently, the prompt is always compiled in a fixed order: `Persona -> Goal -> Context -> Constraints -> Format`. For some LLMs or specialized use cases, putting Constraints *before* the Goal can yield better results.
**Proposed Solution (MVP Scope):**
- Add a "Reorder Blocks" mode toggle in the Settings.
- When active, drag handles appear on the input labels (Goal, Context, etc.).
- The `useEffect` compiler in `BuilderPage` reads the `blockOrder` from the store and synthesizes the prompt based on that sequence.
**User Value & Engagement Impact:** Advanced customization for power users who know the nuances of different LLM architectures (e.g., "Long Context" models).
**Success Metrics:**
- **Customization:** Number of users who change the default block order.

---

### Explicitly Out of Scope
*   **Multi-User Collaboration:** Syncing prompts across different user accounts (focus remains on local-first Tauri privacy).
*   **Asset Generation:** Integration with image generators (Stable Diffusion, Midjourney) is deferred to maintain focus on text prompting.
*   **Third-Party Plugin API:** Opening the form to external developer plugins is out of scope for the current MVP.

---

### Next Steps & Recommendations
1.  **Immediate Priority (Quick Win):** Implement the **Context Snippet Library**. It has the lowest technical complexity and highest immediate value for repetitive workflows.
2.  **Prototyping:** Build a proof-of-concept for the **Output Schema Builder** to test how different LLMs (GPT vs. Claude) react to structured schema instructions.
3.  **User Research:** Survey users of the `HistoryPage` to see if they would prefer "Branching" over the current historical log.

**Prepared by:** Product Engineer, PromptForge Team
