import { ClipboardItem } from "@/store/clipboard";

export function assembleContext(items: ClipboardItem[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0].content;

    return items
        .sort((a, b) => a.timestamp - b.timestamp) // Sort by time, oldest first
        .map((item, index) => {
            const date = new Date(item.timestamp).toLocaleString();
            return `### CLIPBOARD SNIPPET ${index + 1}\n` +
                `Captured: ${date}\n` +
                `----------------------------------------\n` +
                `${item.content}\n` +
                `----------------------------------------\n`;
        })
        .join("\n");
}
