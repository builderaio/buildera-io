-- Configurar verificación de email habilitada por defecto
UPDATE auth.config SET 
  enable_signup = true,
  enable_email_confirmations = true
WHERE true;

-- Insertar configuración de email si no existe
INSERT INTO auth.config (
  enable_signup,
  enable_email_confirmations
) VALUES (
  true,
  true
) ON CONFLICT DO NOTHING;