-- Agregar los nuevos tipos de función al enum business_function_type
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'content_analysis';
ALTER TYPE business_function_type ADD VALUE IF NOT EXISTS 'marketing_analysis';