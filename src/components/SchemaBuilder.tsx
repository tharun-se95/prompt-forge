
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus } from 'lucide-react';
import { OutputFormat, SchemaField, SchemaFieldType } from '../store/builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';

interface SchemaBuilderProps {
    value: OutputFormat;
    onChange: (value: OutputFormat) => void;
    className?: string;
}

export function SchemaBuilder({ value, onChange, className }: SchemaBuilderProps) {

    const handleModeChange = (mode: string) => {
        onChange({ ...value, mode: mode as 'simple' | 'structured' });
    };

    const addField = () => {
        const newField: SchemaField = {
            id: uuidv4(),
            key: '',
            type: 'string',
            description: ''
        };
        onChange({ ...value, schema: [...value.schema, newField] });
    };

    const updateField = (id: string, updates: Partial<SchemaField>) => {
        const newSchema = value.schema.map(f => f.id === id ? { ...f, ...updates } : f);
        onChange({ ...value, schema: newSchema });
    };

    const removeField = (id: string) => {
        onChange({ ...value, schema: value.schema.filter(f => f.id !== id) });
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <Tabs value={value.mode} onValueChange={handleModeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-white/5">
                    <TabsTrigger value="simple" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-200">Text/Simple</TabsTrigger>
                    <TabsTrigger value="structured" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-200">JSON Schema</TabsTrigger>
                </TabsList>
            </Tabs>

            {value.mode === 'simple' ? (
                <Textarea
                    placeholder="e.g. Return a Markdown table..."
                    value={value.raw}
                    onChange={e => onChange({ ...value, raw: e.target.value })}
                    className="min-h-[160px] bg-background/40 border-white/10 focus:border-indigo-500/50 transition-colors text-sm resize-none"
                />
            ) : (
                <div className="space-y-2 bg-background/20 p-2 rounded-md border border-white/5 min-h-[160px] max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {value.schema.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                            <span className="text-xs mb-2 italic">No fields defined.</span>
                            <Button variant="outline" size="sm" onClick={addField} className="h-7 text-xs border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20">
                                <Plus className="size-3 mr-1" /> Add JSON Field
                            </Button>
                        </div>
                    ) : (
                        <>
                            {value.schema.map((field) => (
                                <div key={field.id} className="flex items-center gap-1.5 group">
                                    <Input
                                        placeholder="key_name"
                                        value={field.key}
                                        onChange={e => updateField(field.id, { key: e.target.value.replace(/\s+/g, '_') })}
                                        className="h-7 text-xs bg-background/50 border-white/10 w-24 focus-visible:ring-indigo-500 font-mono"
                                    />
                                    <Select value={field.type} onValueChange={(val: SchemaFieldType) => updateField(field.id, { type: val })}>
                                        <SelectTrigger className="h-7 text-xs w-24 bg-background/50 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="array">Array</SelectItem>
                                            <SelectItem value="object">Object</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        placeholder="Description / Requirements..."
                                        value={field.description}
                                        onChange={e => updateField(field.id, { description: e.target.value })}
                                        className="h-7 text-xs bg-background/50 border-white/10 flex-1 focus-visible:ring-indigo-500"
                                    />
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100 hover:text-rose-400 shrink-0" onClick={() => removeField(field.id)}>
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            ))}
                            <div className="pt-1">
                                <Button variant="ghost" size="sm" onClick={addField} className="h-6 w-full text-[10px] text-muted-foreground hover:bg-white/5 border border-dashed border-white/10">
                                    <Plus className="size-3 mr-1" /> Add Field
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
