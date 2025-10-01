-- Update existing social_content_analysis records to have correct platform based on CID
UPDATE social_content_analysis
SET platform = CASE 
  WHEN cid LIKE 'INST:%' THEN 'instagram'
  WHEN cid LIKE 'TT:%' THEN 'tiktok'
  WHEN cid LIKE 'LI:%' THEN 'linkedin'
  WHEN cid LIKE 'FB:%' THEN 'facebook'
  ELSE platform
END
WHERE platform IS NULL;