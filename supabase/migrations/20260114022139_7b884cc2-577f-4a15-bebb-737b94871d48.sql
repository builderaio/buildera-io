-- Sync primary_company_id for all users who have company_members but NULL primary_company_id
UPDATE profiles p
SET primary_company_id = cm.company_id
FROM company_members cm
WHERE cm.user_id = p.user_id
  AND cm.is_primary = true
  AND p.primary_company_id IS NULL;

-- Also sync for any remaining users who have company_members but still NULL (even without is_primary)
UPDATE profiles p
SET primary_company_id = (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = p.user_id 
  ORDER BY cm.joined_at DESC 
  LIMIT 1
)
WHERE p.primary_company_id IS NULL
  AND EXISTS (SELECT 1 FROM company_members cm WHERE cm.user_id = p.user_id);