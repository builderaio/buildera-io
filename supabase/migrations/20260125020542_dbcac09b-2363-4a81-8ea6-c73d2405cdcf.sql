-- Sincronizar primary_company_id para el usuario específico afectado
UPDATE profiles 
SET primary_company_id = '7352da4b-2e29-4652-8c48-f66ad66aed9f'
WHERE user_id = '49324bda-3397-44e8-8e78-2189d341265a'
AND primary_company_id IS NULL;

-- Sincronizar TODOS los usuarios que tengan company_members pero no primary_company_id
UPDATE profiles p
SET primary_company_id = (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = p.user_id 
  AND cm.is_primary = true
  LIMIT 1
)
WHERE p.primary_company_id IS NULL
AND EXISTS (
  SELECT 1 FROM company_members cm 
  WHERE cm.user_id = p.user_id
);