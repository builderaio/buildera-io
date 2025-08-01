-- Activar la configuración por defecto para que funcione el envío de emails
UPDATE public.email_configurations 
SET is_active = true 
WHERE name = 'Configuración SMTP por Defecto - Buildera' 
   OR is_default = true;