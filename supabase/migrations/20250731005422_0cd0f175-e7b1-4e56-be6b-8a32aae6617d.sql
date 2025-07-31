-- Agregar datos de ejemplo del webhook para mostrar funcionalidad
UPDATE companies 
SET 
  descripcion_empresa = 'Empresa innovadora dedicada al desarrollo de soluciones tecnológicas avanzadas para el sector empresarial. Especializada en transformación digital y automatización de procesos.',
  industria_principal = 'Tecnología',
  facebook_url = 'https://facebook.com/buiry',
  linkedin_url = 'https://linkedin.com/company/buiry',
  twitter_url = 'https://twitter.com/buiry',
  webhook_data = '[{"response": [{"key": "descripcion_empresa", "value": "Empresa innovadora dedicada al desarrollo de soluciones tecnológicas avanzadas para el sector empresarial. Especializada en transformación digital y automatización de procesos."}, {"key": "industria_principal", "value": "Tecnología"}, {"key": "facebook", "value": "https://facebook.com/buiry"}, {"key": "linkedin", "value": "https://linkedin.com/company/buiry"}, {"key": "twitter", "value": "https://twitter.com/buiry"}]}]'::jsonb,
  webhook_processed_at = NOW()
WHERE name = 'Buiry';