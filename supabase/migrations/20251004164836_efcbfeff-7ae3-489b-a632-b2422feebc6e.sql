-- Crear tabla company_invitations
CREATE TABLE public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'member')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Índices para optimizar consultas
CREATE INDEX idx_company_invitations_email ON public.company_invitations(email);
CREATE INDEX idx_company_invitations_token ON public.company_invitations(token);
CREATE INDEX idx_company_invitations_status ON public.company_invitations(status);
CREATE INDEX idx_company_invitations_company ON public.company_invitations(company_id);
CREATE INDEX idx_company_invitations_expires ON public.company_invitations(expires_at) WHERE status = 'pending';

-- Habilitar RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Los miembros de la empresa pueden ver las invitaciones
CREATE POLICY "Company members can view invitations"
ON public.company_invitations FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid()
  )
);

-- Los admins/owners pueden crear invitaciones
CREATE POLICY "Company admins can create invitations"
ON public.company_invitations FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Los admins/owners pueden actualizar invitaciones (cancelar)
CREATE POLICY "Company admins can update invitations"
ON public.company_invitations FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- System puede actualizar invitaciones (para aceptar/expirar)
CREATE POLICY "System can update invitations"
ON public.company_invitations FOR UPDATE
TO service_role
USING (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_company_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_invitations_timestamp
BEFORE UPDATE ON public.company_invitations
FOR EACH ROW
EXECUTE FUNCTION update_company_invitations_updated_at();

-- Función para limpiar invitaciones expiradas
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.company_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;