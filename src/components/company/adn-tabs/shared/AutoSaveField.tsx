import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

interface AutoSaveFieldProps {
  value: string;
  onSave: (value: string) => void;
  type?: "text" | "textarea";
  placeholder?: string;
  className?: string;
}

export const AutoSaveField = ({ 
  value, 
  onSave, 
  type = "text",
  placeholder = "",
  className = ""
}: AutoSaveFieldProps) => {
  const { t } = useTranslation(['common']);
  const [localValue, setLocalValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const initialValueRef = useRef(value);

  useEffect(() => {
    setLocalValue(value || '');
    initialValueRef.current = value;
  }, [value]);

  const handleBlur = useCallback(async () => {
    if (localValue !== initialValueRef.current) {
      setIsSaving(true);
      await onSave(localValue);
      initialValueRef.current = localValue;
      setIsSaving(false);
    }
  }, [localValue, onSave]);

  const baseClassName = `bg-transparent border-none focus:ring-1 focus:ring-primary/30 hover:bg-muted/30 transition-colors ${className}`;

  if (type === "textarea") {
    return (
      <div className="relative">
        <Textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${baseClassName} min-h-[80px] resize-none`}
        />
        {isSaving && <span className="absolute right-2 top-2 text-xs text-muted-foreground">{t('common:adn.saving')}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={baseClassName}
      />
      {isSaving && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{t('common:adn.saving')}</span>}
    </div>
  );
};
