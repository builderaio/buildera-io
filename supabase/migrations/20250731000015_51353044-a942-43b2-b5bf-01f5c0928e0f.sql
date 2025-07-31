-- Crear tabla de empresas separada
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  industry_sector TEXT,
  company_size TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de relación entre usuarios y empresas
CREATE TABLE public.company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, company_id)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para companies
CREATE POLICY "Users can view companies they belong to" 
ON public.companies 
FOR SELECT 
USING (
  id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can update their companies" 
ON public.companies 
FOR UPDATE 
USING (
  id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company owners can delete their companies" 
ON public.companies 
FOR DELETE 
USING (
  id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Políticas RLS para company_members
CREATE POLICY "Users can view their own memberships" 
ON public.company_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Company admins can view all members" 
ON public.company_members 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can add members" 
ON public.company_members 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can update memberships" 
ON public.company_members 
FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Company admins can remove members" 
ON public.company_members 
FOR DELETE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Función para obtener la empresa principal de un usuario
CREATE OR REPLACE FUNCTION public.get_user_primary_company(user_id_param UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = user_id_param AND is_primary = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear empresa y asignar al usuario como owner
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  company_name TEXT,
  company_description TEXT DEFAULT NULL,
  website_url TEXT DEFAULT NULL,
  industry_sector TEXT DEFAULT NULL,
  company_size TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_company_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Crear la empresa
  INSERT INTO public.companies (
    name, description, website_url, industry_sector, company_size, created_by
  ) VALUES (
    company_name, company_description, website_url, industry_sector, company_size, current_user_id
  ) RETURNING id INTO new_company_id;
  
  -- Asignar al usuario como owner y empresa principal
  INSERT INTO public.company_members (
    user_id, company_id, role, is_primary
  ) VALUES (
    current_user_id, new_company_id, 'owner', true
  );
  
  RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover campos de empresa de la tabla profiles (manteniendo compatibilidad temporal)
-- Estos campos se moverán gradualmente a la nueva estructura
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_company_id UUID REFERENCES public.companies(id);

-- Actualizar trigger para manejar nuevos usuarios de empresa
CREATE OR REPLACE FUNCTION public.handle_new_company_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Si es un usuario tipo company, crear la empresa automáticamente
  IF NEW.raw_user_meta_data->>'user_type' = 'company' THEN
    SELECT public.create_company_with_owner(
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa'),
      NULL,
      NEW.raw_user_meta_data->>'website_url',
      NEW.raw_user_meta_data->>'industry_sector',
      NEW.raw_user_meta_data->>'company_size'
    ) INTO new_company_id;
    
    -- Actualizar el perfil con la empresa principal
    UPDATE public.profiles 
    SET primary_company_id = new_company_id 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para manejar nuevos usuarios de empresa
DROP TRIGGER IF EXISTS on_company_user_created ON auth.users;
CREATE TRIGGER on_company_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'user_type' = 'company')
  EXECUTE FUNCTION public.handle_new_company_user();

-- Trigger para actualizar updated_at en companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indices para mejorar performance
CREATE INDEX idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX idx_company_members_primary ON public.company_members(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_companies_created_by ON public.companies(created_by);