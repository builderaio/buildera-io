import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Hash, MonitorPlay, Type } from "lucide-react";

interface Props {
  insightsText: string;
  onUseIdea?: (ideaTitle: string) => void;
}

// Very lightweight parser for the markdown-like insights text
function parseIdeas(text: string) {
  const ideas: Array<{ title: string; format?: string; platform?: string; hashtags?: string[]; schedule?: string }>= [];
  const lines = text.split(/\r?\n/);
  let current: any = null;
  for (const line of lines) {
    const titleMatch = line.match(/\*\*Título\/tema\*\*:\s*(.+)/i);
    if (titleMatch) {
      if (current) ideas.push(current);
      current = { title: titleMatch[1].trim() };
      continue;
    }
    if (!current) continue;
    const formatMatch = line.match(/\*\*Formato sugerido\*\*:\s*(.+)/i);
    if (formatMatch) current.format = formatMatch[1].trim();
    const platformMatch = line.match(/\*\*Plataforma recomendada\*\*:\s*(.+)/i);
    if (platformMatch) current.platform = platformMatch[1].trim();
    const hashtagsMatch = line.match(/\*\*Hashtags\*\*:\s*(.+)/i);
    if (hashtagsMatch) {
      current.hashtags = hashtagsMatch[1]
        .split(/[,#]/)
        .map((t) => t.replace(/[#\s]/g, '').trim())
        .filter(Boolean)
        .slice(0, 6);
    }
    const scheduleMatch = line.match(/\*\*Hora\/día sugerido para publicar\*\*:\s*(.+)/i);
    if (scheduleMatch) current.schedule = scheduleMatch[1].trim();
  }
  if (current) ideas.push(current);
  return ideas;
}

export default function InsightsRenderer({ insightsText, onUseIdea }: Props) {
  const ideas = parseIdeas(insightsText);
  if (!ideas.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ideas.map((idea, idx) => (
        <Card key={idx} className="border border-border">
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold text-base">{idea.title}</div>
            <div className="flex flex-wrap gap-2 text-sm">
              {idea.format && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Type className="h-3 w-3" /> {idea.format}
                </Badge>
              )}
              {idea.platform && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MonitorPlay className="h-3 w-3" /> {idea.platform}
                </Badge>
              )}
              {idea.schedule && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" /> {idea.schedule}
                </Badge>
              )}
            </div>
            {!!idea.hashtags?.length && (
              <div className="flex flex-wrap gap-1">
                {idea.hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> {tag}
                  </Badge>
                ))}
              </div>
            )}
            {onUseIdea && (
              <div>
                <Button size="sm" variant="outline" onClick={() => onUseIdea(idea.title!)}>
                  Usar esta idea
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}