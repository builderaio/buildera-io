import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

interface AudienceHighlightsWidgetProps {
  companyId?: string;
  userId?: string;
  maxItems?: number;
}

interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  estimated_size?: number;
  confidence_score?: number;
  conversion_potential?: number;
}

const AudienceHighlightsWidget = ({ 
  companyId, 
  userId,
  maxItems = 3 
}: AudienceHighlightsWidgetProps) => {
  const { t } = useTranslation(['marketing', 'common']);
  const navigate = useNavigate();
  const [audiences, setAudiences] = useState<AudienceSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudiences();
  }, [companyId, userId]);

  const loadAudiences = async () => {
    try {
      setLoading(true);
      
      let resolvedCompanyId = companyId;
      
      // If no companyId provided, get it from user's membership
      if (!resolvedCompanyId && userId) {
        const { data: member } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .maybeSingle();
        
        resolvedCompanyId = member?.company_id;
      }
      
      if (!resolvedCompanyId) {
        setAudiences([]);
        return;
      }

      const { data, error } = await supabase
        .from('company_audiences')
        .select('id, name, description, estimated_size, confidence_score, conversion_potential')
        .eq('company_id', resolvedCompanyId)
        .eq('is_active', true)
        .order('conversion_potential', { ascending: false })
        .limit(maxItems);

      if (error) throw error;
      setAudiences(data || []);
    } catch (error) {
      console.error('Error loading audiences:', error);
      setAudiences([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (audiences.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {t('audiences.noData')}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/company-dashboard?view=marketing-hub&tab=analyze')}
        >
          {t('audiences.create', 'Crear Audiencia')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {audiences.map((audience) => (
        <div 
          key={audience.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{audience.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {audience.estimated_size && (
                <span>{(audience.estimated_size / 1000).toFixed(1)}K {t('common:users', 'usuarios')}</span>
              )}
              {audience.conversion_potential && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {Math.round(audience.conversion_potential * 100)}%
                </Badge>
              )}
            </div>
          </div>
          {audience.confidence_score && audience.confidence_score > 0.7 && (
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
        </div>
      ))}
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full text-primary"
        onClick={() => navigate('/company-dashboard?view=marketing-hub&tab=analyze')}
      >
        {t('audiences.viewAll', 'Ver todas las audiencias')}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

export default AudienceHighlightsWidget;
