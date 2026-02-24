import { useEffect, useState } from "react";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { Button } from "@/components/ui/button";
import { Play, Copy as CopyIcon, RefreshCcw } from "lucide-react";

export function ClipboardPage() {
    const [clipboardText, setClipboardText] = useState("");

    const fetchClipboard = async () => {
        try {
            const text = await readText();
            setClipboardText(text || "No text found in clipboard.");
        } catch (e) {
            console.error(e);
            setClipboardText("Failed to read clipboard. Ensure permissions are granted.");
        }
    };

    useEffect(() => {
        fetchClipboard();
        // In a real app, you might set an interval or listen to OS events
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clipboard Intelligence</h1>
                    <p className="text-muted-foreground mt-2">Manage copied items and run deep cognitive workflows directly on them.</p>
                </div>
                <Button variant="outline" onClick={fetchClipboard}>
                    <RefreshCcw className="size-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="flex flex-col gap-4 border bg-card rounded-xl p-6 shadow-sm flex-1">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CopyIcon className="size-5 text-muted-foreground" />
                    Current Clipboard Content
                </h3>

                <div className="bg-muted/50 p-4 rounded-md border text-sm font-mono whitespace-pre-wrap flex-1 overflow-y-auto">
                    {clipboardText}
                </div>

                <div className="flex gap-3 justify-end mt-4">
                    <Button variant="secondary">
                        <Play className="size-4 mr-2" />
                        Explain Code
                    </Button>
                    <Button variant="secondary">
                        <Play className="size-4 mr-2" />
                        Refactor
                    </Button>
                    <Button>
                        <Play className="size-4 mr-2" />
                        Send to Builder
                    </Button>
                </div>
            </div>
        </div>
    );
}
