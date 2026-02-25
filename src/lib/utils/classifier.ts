export type ContentType = 'code' | 'json' | 'sql' | 'log' | 'text';

export function detectContentType(text: string): { type: ContentType; detail?: string } {
    const trimmed = text.trim();

    // JSON Detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return { type: 'json' };
        } catch (e) {
            // Not valid JSON, but maybe partial JSON or code?
        }
    }

    // SQL Detection
    const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|GROUP BY|ORDER BY|JOIN)\b/i;
    if (sqlKeywords.test(trimmed)) {
        return { type: 'sql' };
    }

    // Log Detection (Stack traces, common log patterns)
    const logPatterns = [
        /at .*\((.*):(\d+):(\d+)\)/, // Stack trace
        /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/, // ISO Timestamp
        /\d{2}:\d{2}:\d{2}\s+(INFO|ERROR|WARN|DEBUG|TRACE)/i, // Log level
        /Error: .*\n\s+at /i
    ];
    if (logPatterns.some(p => p.test(trimmed))) {
        return { type: 'log' };
    }

    // Code Detection (Generic)
    const codePatterns = [
        /\b(function|const|let|var|class|export|import|if|else|return|switch|case|break)\b/,
        /\b(def|class|if|elif|else|import|from|return|yield|with|as)\b/, // Python
        /\b(fn|pub|use|let|mut|match|impl|trait|struct|enum)\b/, // Rust
        /[{};]/, // Braces or semicolons
        /=>/, // Arrow functions
    ];
    if (codePatterns.some(p => p.test(trimmed))) {
        // Try to be more specific if possible
        if (/\b(const|let|var|function|export|import)\b/.test(trimmed)) return { type: 'code', detail: 'typescript' };
        if (/\b(def|class|import|from)\b/.test(trimmed)) return { type: 'code', detail: 'python' };
        if (/\b(pub|fn|use|let|match)\b/.test(trimmed)) return { type: 'code', detail: 'rust' };
        return { type: 'code' };
    }

    return { type: 'text' };
}
