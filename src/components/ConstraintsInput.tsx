import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils'; // Assuming this exists from shadcn/ui

interface ConstraintsInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function ConstraintsInput({ value, onChange, placeholder, className }: ConstraintsInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    useEffect(() => {
        handleScroll();
    }, [value]);

    const renderHighlightedText = () => {
        if (!value) return null;

        const lines = value.split('\n');
        return lines.map((line, index) => {
            let content: React.ReactNode = line;
            let lineClass = "";

            if (line.trim().startsWith('!')) {
                // critical constraint
                content = <><span className="text-rose-400 font-bold">!</span><span className="text-rose-200/90 font-medium">{line.substring(line.indexOf('!') + 1)}</span></>;
                lineClass = "bg-rose-500/10 -mx-1 px-1 rounded-sm";
            } else if (line.trim().startsWith('?')) {
                // optional constraint
                content = <><span className="text-emerald-400 font-bold">?</span><span className="text-emerald-200/80 italic">{line.substring(line.indexOf('?') + 1)}</span></>;
                lineClass = "bg-emerald-500/5 -mx-1 px-1 rounded-sm";
            }

            return (
                <div key={index} className={cn("min-h-[1.5rem]", lineClass)}>
                    {content || <br />}
                </div>
            );
        });
    };

    return (
        <div className={cn("relative group", className)}>
            <div
                className={cn(
                    "absolute inset-0 bg-background/40 border border-white/10 rounded-md transition-colors pointer-events-none",
                    isFocused ? "border-indigo-500/50 ring-1 ring-indigo-500/50" : ""
                )}
            />

            {/* Highlight Backdrop */}
            <div
                ref={backdropRef}
                className="absolute inset-0 p-3 pt-2 text-sm font-sans whitespace-pre-wrap overflow-hidden break-words z-0 text-transparent pointer-events-none"
                aria-hidden="true"
            >
                {renderHighlightedText()}
            </div>

            {/* Actual Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                spellCheck="false"
                className="relative z-10 w-full h-full p-3 pt-2 text-sm font-sans bg-transparent text-slate-300 resize-none outline-none focus:ring-0 appearance-none m-0 caret-indigo-400"
            />

            {/* Helper Footer */}
            <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-between text-[10px] text-muted-foreground/60 px-1 pointer-events-none">
                <span>Start line with <span className="text-rose-400 font-bold">!</span> for Critical</span>
                <span>Start line with <span className="text-emerald-400 font-bold">?</span> for Optional</span>
            </div>
        </div>
    );
}
