import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ReactNode } from 'react';

interface DraggableBlockProps {
    id: string;
    children: ReactNode;
    isReordering: boolean;
    className?: string;
}

export function DraggableBlock({ id, children, isReordering, className = "" }: DraggableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group ${isDragging ? 'opacity-50 ring-2 ring-indigo-500 rounded-2xl shadow-2xl' : ''} ${className}`}
        >
            {isReordering && (
                <div
                    className="absolute -left-6 top-1/2 -translate-y-1/2 p-1.5 cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground transition-colors z-20"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={16} />
                </div>
            )}
            <div className={`${isReordering ? 'pointer-events-none opacity-80' : ''}`}>
                {children}
            </div>
        </div>
    );
}
