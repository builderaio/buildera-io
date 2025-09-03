import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, objectiveData, objectiveId, companyId } = await req.json();
    console.log(`🎯 Iniciando operación: ${action}`, { objectiveData, objectiveId, companyId });

    // Obtener el usuario autenticado
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    let result;

    switch (action) {
      case 'create':
        console.log('📝 Creando nuevo objetivo...');
        const { data: newObjective, error: createError } = await supabaseClient
          .from('company_objectives')
          .insert({
            company_id: companyId,
            title: objectiveData.title,
            description: objectiveData.description,
            objective_type: objectiveData.objective_type,
            priority: objectiveData.priority,
            target_date: objectiveData.target_date || null,
            status: 'active'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creando objetivo:', createError);
          throw createError;
        }

        result = newObjective;
        console.log('✅ Objetivo creado exitosamente:', result);
        break;

      case 'update':
        console.log('📝 Actualizando objetivo...');
        const { data: updatedObjective, error: updateError } = await supabaseClient
          .from('company_objectives')
          .update({
            title: objectiveData.title,
            description: objectiveData.description,
            objective_type: objectiveData.objective_type,
            priority: objectiveData.priority,
            target_date: objectiveData.target_date || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', objectiveId)
          .eq('company_id', companyId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error actualizando objetivo:', updateError);
          throw updateError;
        }

        result = updatedObjective;
        console.log('✅ Objetivo actualizado exitosamente:', result);
        break;

      case 'delete':
        console.log('🗑️ Eliminando objetivo...');
        const { error: deleteError } = await supabaseClient
          .from('company_objectives')
          .delete()
          .eq('id', objectiveId)
          .eq('company_id', companyId);

        if (deleteError) {
          console.error('❌ Error eliminando objetivo:', deleteError);
          throw deleteError;
        }

        result = { success: true, message: 'Objetivo eliminado exitosamente' };
        console.log('✅ Objetivo eliminado exitosamente');
        break;

      case 'list':
        console.log('📋 Obteniendo objetivos...');
        const { data: objectives, error: listError } = await supabaseClient
          .from('company_objectives')
          .select('*')
          .eq('company_id', companyId)
          .order('priority', { ascending: true });

        if (listError) {
          console.error('❌ Error obteniendo objetivos:', listError);
          throw listError;
        }

        result = objectives;
        console.log('✅ Objetivos obtenidos exitosamente:', result?.length || 0);
        break;

      default:
        throw new Error(`Acción no válida: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error en manage-company-objectives:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});