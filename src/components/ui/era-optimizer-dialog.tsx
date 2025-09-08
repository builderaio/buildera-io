import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

interface EraOptimizerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  optimizedText: string;
  onAccept: () => void;
  onReject: () => void;
}

export function EraOptimizerDialog({
  isOpen,
  onClose,
  originalText,
  optimizedText,
  onAccept,
  onReject
}: EraOptimizerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-gradient-to-br from-white to-purple-50 border-purple-200">
        <DialogHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-800">Era - Asistente IA de Buildera</h3>
              <p className="text-sm text-purple-600 font-normal">Ha optimizado tu contenido para redes sociales</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[50vh] px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <h4 className="font-semibold text-gray-700">Contenido Original</h4>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {originalText}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                <h4 className="font-semibold text-purple-700">Contenido Optimizado por Era</h4>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {optimizedText}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-purple-100 -mx-6 -mb-6 px-6 pb-6 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
          <Button 
            onClick={onAccept} 
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
          >
            ✨ Usar Optimización de Era
          </Button>
          <Button 
            onClick={onReject} 
            variant="outline" 
            className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Mantener Original
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}