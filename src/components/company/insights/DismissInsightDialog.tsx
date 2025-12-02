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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation('marketing');
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const predefinedReasons = [
    t('insights.dismiss.reasons.notRelevant'),
    t('insights.dismiss.reasons.notAligned'),
    t('insights.dismiss.reasons.alreadyImplemented'),
    t('insights.dismiss.reasons.noResources'),
    t('insights.dismiss.reasons.other')
  ];

  const handleConfirm = () => {
    const finalReason = reason === t('insights.dismiss.reasons.other') ? customReason : reason;
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
          <DialogTitle>{t('insights.dismiss.title')}</DialogTitle>
          <DialogDescription>
            {t('insights.dismiss.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label>{t('insights.dismiss.question')}</Label>
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

          {reason === t('insights.dismiss.reasons.other') && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="custom">{t('insights.dismiss.specifyReason')}</Label>
              <Textarea
                id="custom"
                placeholder={t('insights.dismiss.placeholder')}
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
            {t('insights.dismiss.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || (reason === t('insights.dismiss.reasons.other') && !customReason)}
            className="bg-destructive hover:bg-destructive/90"
          >
            {t('insights.dismiss.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
