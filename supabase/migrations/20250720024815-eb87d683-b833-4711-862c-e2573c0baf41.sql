-- IMPORTANTE: Esto es temporal para desarrollo
-- En producción, las API keys deben estar encriptadas y este proceso debe ser más seguro

-- Para las API keys existentes que solo tienen el hash, necesitamos que el usuario las vuelva a ingresar
-- Por ahora, vamos a invalidarlas para que el admin las vuelva a configurar con API keys reales

UPDATE llm_api_keys 
SET status = 'inactive',
    notes = COALESCE(notes, '') || ' - Necesita reconfiguración con API key real'
WHERE api_key_hash LIKE '***%';