-- Crear tabla para configuración de prompts de Era
CREATE TABLE public.era_prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_type TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  specific_instructions TEXT NOT NULL,
  max_words INTEGER DEFAULT 200,
  tone TEXT DEFAULT 'professional',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.era_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage Era prompt templates" 
ON public.era_prompt_templates 
FOR ALL 
USING (true);

-- Insertar prompts predeterminados
INSERT INTO public.era_prompt_templates (field_type, system_prompt, specific_instructions, max_words, tone) VALUES
(
  'misión',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza esta MISIÓN EMPRESARIAL:
- Debe ser clara y inspiradora
- Enfocada en el propósito de la empresa
- Incluye el valor que aporta a clientes/sociedad
- Máximo 150 palabras
- Usa verbos en presente',
  150,
  'inspirational'
),
(
  'visión',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza esta VISIÓN EMPRESARIAL:
- Debe ser aspiracional y motivadora
- Enfocada en el futuro deseado
- Inspire a empleados y stakeholders
- Máximo 100 palabras
- Usa un lenguaje futuro y positivo',
  100,
  'aspirational'
),
(
  'valores',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza estos VALORES EMPRESARIALES:
- Deben ser principios claros y accionables
- Reflejen la cultura de la empresa
- Sean memorables y aplicables
- Formato de lista o párrafo breve
- Máximo 120 palabras',
  120,
  'principled'
),
(
  'descripción de producto',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza esta DESCRIPCIÓN DE PRODUCTO:
- Enfócate en beneficios, no solo características
- Incluye propuesta de valor única
- Dirígete al público objetivo
- Usa lenguaje persuasivo pero factual
- Máximo 200 palabras',
  200,
  'persuasive'
),
(
  'objetivo empresarial',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza este OBJETIVO EMPRESARIAL:
- Debe ser específico y medible
- Orientado a resultados
- Temporalmente definido
- Realista pero ambicioso
- Máximo 100 palabras',
  100,
  'focused'
),
(
  'descripción de empresa',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza esta DESCRIPCIÓN DE EMPRESA:
- Historia y propósito claros
- Diferenciadores competitivos
- Enfoque en valor al cliente
- Tono profesional y confiable
- Máximo 250 palabras',
  250,
  'professional'
),
(
  'default',
  'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
  'Optimiza este CONTENIDO EMPRESARIAL:
- Mejora claridad y profesionalismo
- Mantén el mensaje principal
- Optimiza para impacto
- Usa lenguaje empresarial apropiado',
  200,
  'professional'
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_era_prompt_templates_updated_at
BEFORE UPDATE ON public.era_prompt_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();