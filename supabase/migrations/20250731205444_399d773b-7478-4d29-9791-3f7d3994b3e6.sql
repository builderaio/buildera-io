-- Primera parte: agregar nuevos valores al enum
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'instagram_intelligent_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'linkedin_intelligent_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'facebook_intelligent_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'tiktok_intelligent_analysis';