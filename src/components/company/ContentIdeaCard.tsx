import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Edit3, MoreHorizontal, CheckCircle2, X } from "lucide-react";

interface ContentIdeaCardProps {
  idea: {
    id: string;
    title: string;
    content?: string;
    strategy?: string;
    platform?: string;
    format?: string;
  };
  onCreateContent: () => void;
  onComplete: () => void;
  onDismiss: () => void;
}

export const ContentIdeaCard = ({
  idea,
  onCreateContent,
  onComplete,
  onDismiss,
}: ContentIdeaCardProps) => {
  const displayContent = idea.strategy || idea.content || 'Sin descripción';
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold mb-2 line-clamp-2">
              {idea.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {displayContent}
            </p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {idea.platform && (
              <Badge variant="outline" className="text-xs">
                {idea.platform}
              </Badge>
            )}
            {idea.format && (
              <Badge variant="secondary" className="text-xs">
                {idea.format}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardFooter className="flex gap-2 pt-2">
        <Button 
          size="sm" 
          onClick={onCreateContent}
          className="flex-1 gap-2"
          variant="default"
        >
          <Sparkles className="w-4 h-4" />
          Crear Contenido
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="px-2">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDismiss} className="text-destructive">
              <X className="w-4 h-4 mr-2" />
              Descartar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};
