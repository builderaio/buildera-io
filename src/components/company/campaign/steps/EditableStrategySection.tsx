import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

interface EditableStrategySectionProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onSave?: () => void;
  editMode?: boolean;
  setEditMode?: (value: boolean) => void;
}

export function EditableStrategySection({
  title,
  icon,
  children,
  onSave,
  editMode = false,
  setEditMode
}: EditableStrategySectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          {icon}
          {title}
        </CardTitle>
        <div className="flex gap-2">
          {!editMode && setEditMode && (
            <Button
              onClick={() => setEditMode(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          )}
          {editMode && setEditMode && (
            <>
              <Button
                onClick={() => {
                  onSave?.();
                  setEditMode(false);
                }}
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar
              </Button>
              <Button
                onClick={() => setEditMode(false)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  editMode: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export function EditableText({
  value,
  onChange,
  editMode,
  multiline = false,
  placeholder,
  className
}: EditableTextProps) {
  if (!editMode) {
    return <p className={className || "text-sm text-gray-700"}>{value}</p>;
  }

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "min-h-[100px]"}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  editMode: boolean;
  emptyMessage?: string;
  addButtonText?: string;
}

export function EditableList({
  items,
  onChange,
  editMode,
  emptyMessage = "No hay elementos",
  addButtonText = "Agregar elemento"
}: EditableListProps) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  if (!editMode) {
    if (!items || items.length === 0) {
      return <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary font-bold text-xs">{idx + 1}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={item}
              onChange={(e) => handleUpdate(idx, e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          <Button
            onClick={() => handleRemove(idx)}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Nuevo elemento..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {addButtonText}
        </Button>
      </div>
    </div>
  );
}

interface EditableKeyValuePairProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  editMode: boolean;
  fields: { key: string; label: string; multiline?: boolean }[];
}

export function EditableKeyValuePair({
  data,
  onChange,
  editMode,
  fields
}: EditableKeyValuePairProps) {
  const handleChange = (key: string, value: any) => {
    onChange({ ...data, [key]: value });
  };

  if (!editMode) {
    return (
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="bg-muted/50 p-3 rounded-lg">
            <h5 className="font-medium text-sm text-gray-600 mb-1">{field.label}</h5>
            <p className="font-semibold text-gray-800">{data[field.key] || 'No definido'}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium mb-2">{field.label}</label>
          {field.multiline ? (
            <Textarea
              value={data[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="min-h-[60px]"
            />
          ) : (
            <Input
              value={data[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
