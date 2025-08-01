import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Globe, Calendar, Award } from "lucide-react";
import { Expert } from "@/hooks/useExperts";

interface ExpertCardProps {
  expert: Expert;
  onBookSession: (expertId: string) => void;
}

export const ExpertCard = ({ expert, onBookSession }: ExpertCardProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'advanced':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={expert.profile_image_url} alt={expert.full_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(expert.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{expert.full_name}</h3>
              {expert.is_verified && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Award className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            
            <p className="text-primary font-medium mb-2">{expert.specialization}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{expert.rating}</span>
                <span>({expert.total_sessions} sesiones)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{expert.experience_years} años exp.</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${expert.hourly_rate}
            </div>
            <div className="text-sm text-muted-foreground">por hora</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {expert.bio}
        </p>

        {/* Especialidades */}
        {expert.specializations && expert.specializations.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">Especialidades:</div>
            <div className="flex flex-wrap gap-1">
              {expert.specializations.slice(0, 3).map((spec) => (
                <Badge 
                  key={spec.id} 
                  variant="outline" 
                  className={`text-xs ${getSkillLevelColor(spec.skill_level)}`}
                >
                  {spec.subcategory.replace('_', ' ')}
                </Badge>
              ))}
              {expert.specializations.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{expert.specializations.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Idiomas y Zona Horaria */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span>{expert.languages.join(', ')}</span>
          </div>
          <div>{expert.timezone}</div>
        </div>

        <Button 
          onClick={() => onBookSession(expert.id)}
          className="w-full"
          size="lg"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Agendar Sesión
        </Button>
      </CardContent>
    </Card>
  );
};