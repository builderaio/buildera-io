-- Asociar el usuario manuel@buildera.io con la empresa Buildera
INSERT INTO company_members (user_id, company_id, role, is_primary, created_at)
SELECT 
  p.id as user_id,
  c.id as company_id,
  'admin' as role,
  true as is_primary,
  now() as created_at
FROM profiles p, companies c
WHERE p.email = 'manuel@buildera.io' 
  AND c.name = 'Buildera'
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.user_id = p.id AND cm.company_id = c.id
  );