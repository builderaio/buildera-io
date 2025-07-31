import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SampleDataProps {
  userId: string;
  onDataCreated: () => void;
}

export const Dashboard360SampleData: React.FC<SampleDataProps> = ({ userId, onDataCreated }) => {
  const { toast } = useToast();

  const createSampleData = async () => {
    try {
      // Crear algunos agentes de muestra
      const { error: agentError } = await supabase
        .from('agent_instances')
        .upsert([
          {
            user_id: userId,
            template_id: '00000000-0000-0000-0000-000000000001',
            name: 'Asistente de Marketing',
            contextualized_instructions: 'Ayuda con estrategias de marketing digital',
            status: 'active'
          },
          {
            user_id: userId,
            template_id: '00000000-0000-0000-0000-000000000002',
            name: 'Generador de Contenido',
            contextualized_instructions: 'Crea contenido para redes sociales',
            status: 'active'
          }
        ], { onConflict: 'user_id,name' });

      // Crear algunas misiones completadas
      const { error: missionError } = await supabase
        .from('agent_missions')
        .upsert([
          {
            user_id: userId,
            agent_instance_id: '00000000-0000-0000-0000-000000000001',
            title: 'Análisis de competencia',
            description: 'Investigar competidores del sector',
            status: 'completed',
            started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            user_id: userId,
            agent_instance_id: '00000000-0000-0000-0000-000000000002',
            title: 'Crear posts Instagram',
            description: 'Generar 10 posts para la semana',
            status: 'completed',
            started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          }
        ], { onConflict: 'user_id,title' });

      // Crear algunos archivos de muestra
      const { error: fileError } = await supabase
        .from('company_files')
        .upsert([
          {
            user_id: userId,
            file_name: 'Manual de Marca.pdf',
            file_type: 'application/pdf',
            file_path: '/documents/brand-manual.pdf',
            file_size: 2048000,
            description: 'Guía de identidad corporativa'
          },
          {
            user_id: userId,
            file_name: 'Estrategia Marketing 2024.docx',
            file_type: 'application/docx',
            file_path: '/documents/marketing-strategy.docx',
            file_size: 1024000,
            description: 'Plan estratégico de marketing'
          }
        ], { onConflict: 'user_id,file_name' });

      // Crear posts de Instagram de muestra
      const { error: postsError } = await supabase
        .from('instagram_posts')
        .upsert([
          {
            user_id: userId,
            post_id: 'sample_post_1',
            caption: 'Nuevo producto disponible! #marketing #innovation',
            like_count: 145,
            comment_count: 23,
            posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            hashtags: ['marketing', 'innovation'],
            mentions: []
          },
          {
            user_id: userId,
            post_id: 'sample_post_2',
            caption: 'Gracias por confiar en nosotros #gratitude #customers',
            like_count: 89,
            comment_count: 12,
            posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            hashtags: ['gratitude', 'customers'],
            mentions: []
          }
        ], { onConflict: 'user_id,post_id' });

      // Crear conexiones sociales de muestra
      const { error: linkedinError } = await supabase
        .from('linkedin_connections')
        .upsert([
          {
            user_id: userId,
            access_token: 'sample_token',
            scope: 'r_liteprofile r_emailaddress w_member_social',
            company_page_id: 'sample_company',
            company_page_name: 'Mi Empresa'
          }
        ], { onConflict: 'user_id' });

      if (agentError || missionError || fileError || postsError || linkedinError) {
        console.error('Errors creating sample data:', { agentError, missionError, fileError, postsError, linkedinError });
      }

      // Ahora calcular métricas
      const { error: metricsError } = await supabase.functions.invoke('calculate-dashboard-metrics');
      
      if (metricsError) {
        throw metricsError;
      }

      toast({
        title: "Datos de muestra creados",
        description: "Se han generado datos de ejemplo para mostrar el dashboard",
      });

      onDataCreated();
    } catch (error: any) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear los datos de muestra",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="text-center p-8">
      <h3 className="text-lg font-semibold mb-4">Inicializar Dashboard</h3>
      <p className="text-muted-foreground mb-6">
        Crea datos de muestra para ver tu dashboard 360° en acción
      </p>
      <Button onClick={createSampleData} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Generar Datos de Muestra
      </Button>
    </div>
  );
};