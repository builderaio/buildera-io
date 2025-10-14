import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DismissInsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export const DismissInsightDialog = ({
  open,
  onOpenChange,
  onConfirm
}: DismissInsightDialogProps) => {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const predefinedReasons = [
    "Ya no es relevante para mi negocio",
    "No se alinea con mi estrategia actual",
    "Ya lo implementé de otra manera",
    "No tengo recursos para ejecutarlo",
    "Otro motivo"
  ];

  const handleConfirm = () => {
    const finalReason = reason === "Otro motivo" ? customReason : reason;
    if (finalReason) {
      onConfirm(finalReason);
      setReason("");
      setCustomReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Descartar Insight</DialogTitle>
          <DialogDescription>
            Ayúdanos a entender por qué este insight no es útil. Esta información nos ayudará a mejorar las recomendaciones futuras.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label>¿Por qué deseas descartar este insight?</Label>
          <RadioGroup value={reason} onValueChange={setReason}>
            {predefinedReasons.map((r) => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="font-normal cursor-pointer">
                  {r}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason === "Otro motivo" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="custom">Especifica el motivo</Label>
              <Textarea
                id="custom"
                placeholder="Describe por qué este insight no es útil..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason("");
              setCustomReason("");
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || (reason === "Otro motivo" && !customReason)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Confirmar Descarte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
