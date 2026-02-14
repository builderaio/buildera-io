import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Check, Pencil, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FieldStatus = 'inferred' | 'confirmed' | 'editing' | 'manual';

interface InferredFieldCardProps {
  label: string;
  inferredValue: string | null;
  currentValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** Section label for current state vs desired */
  showDualState?: boolean;
  currentStateLabel?: string;
  desiredStateLabel?: string;
}

export default function InferredFieldCard({
  label,
  inferredValue,
  currentValue,
  onChange,
  placeholder,
  minHeight = '100px',
  showDualState = false,
  currentStateLabel,
  desiredStateLabel,
}: InferredFieldCardProps) {
  const { t } = useTranslation();
  const hasInference = !!inferredValue;
  
  const [status, setStatus] = useState<FieldStatus>(
    hasInference && !currentValue ? 'inferred' : currentValue ? 'confirmed' : 'manual'
  );

  const handleConfirm = () => {
    if (inferredValue) {
      onChange(inferredValue);
      setStatus('confirmed');
    }
  };

  const handleEdit = () => {
    if (inferredValue && !currentValue) {
      onChange(inferredValue);
    }
    setStatus('editing');
  };

  const handleRewrite = () => {
    onChange('');
    setStatus('editing');
  };

  const statusBadge = () => {
    switch (status) {
      case 'inferred':
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
            <Bot className="h-3 w-3" />
            {t('journey.sdna.inferred', 'Inferido por el sistema')}
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-green-500/10 text-green-700 border-green-500/20">
            <Check className="h-3 w-3" />
            {t('journey.sdna.confirmed', 'Confirmado')}
          </Badge>
        );
      case 'manual':
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-amber-500/10 text-amber-700 border-amber-500/20">
            <AlertCircle className="h-3 w-3" />
            {t('journey.sdna.manualRequired', 'Requiere input manual')}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-medium text-sm">{label}</span>
        {statusBadge()}
      </div>

      {/* Show inferred value in read-only mode when status is 'inferred' */}
      {status === 'inferred' && inferredValue && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-3 space-y-3">
            {showDualState && currentStateLabel && (
              <p className="text-[11px] font-mono uppercase tracking-wider text-primary/70">
                {currentStateLabel}
              </p>
            )}
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {inferredValue}
            </p>
            <p className="text-[11px] text-primary/60 italic flex items-center gap-1">
              <Bot className="h-3 w-3" />
              {t('journey.sdna.inferredSource', 'Basado en análisis digital')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={handleConfirm} className="gap-1 h-8 text-xs">
                <Check className="h-3 w-3" />
                {t('journey.sdna.confirmAction', 'Confirmar')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleEdit} className="gap-1 h-8 text-xs">
                <Pencil className="h-3 w-3" />
                {t('journey.sdna.editAction', 'Editar')}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRewrite} className="gap-1 h-8 text-xs">
                <Sparkles className="h-3 w-3" />
                {t('journey.sdna.rewriteAction', 'Reescribir')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editable textarea when editing or manual */}
      {(status === 'editing' || status === 'manual') && (
        <div className="space-y-2">
          {showDualState && desiredStateLabel && (
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              {desiredStateLabel}
            </p>
          )}
          <Textarea
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn("resize-none", `min-h-[${minHeight}]`)}
            style={{ minHeight }}
          />
          {status === 'editing' && hasInference && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStatus('inferred')}
              className="text-xs text-muted-foreground"
            >
              {t('journey.sdna.viewInferred', 'Ver valor inferido')}
            </Button>
          )}
        </div>
      )}

      {/* Confirmed: show value as read-only with edit option */}
      {status === 'confirmed' && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 pb-3 space-y-2">
            <p className="text-sm whitespace-pre-line leading-relaxed">{currentValue}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="gap-1 h-7 text-xs text-muted-foreground"
            >
              <Pencil className="h-3 w-3" />
              {t('journey.sdna.editAction', 'Editar')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
