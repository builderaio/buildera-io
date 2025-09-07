-- Create secure admin user to replace hardcoded credentials
-- Note: In production, passwords should be properly hashed
INSERT INTO public.admin_credentials (username, password_hash, role, is_active)
VALUES ('admin@buildera.io', 'temp_hash_replace_with_bcrypt', 'super_admin', true)
ON CONFLICT (username) DO NOTHING;