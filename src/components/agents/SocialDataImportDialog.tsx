import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Instagram, Linkedin, Facebook, Music2, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SocialDataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  companyId: string;
  onSuccess?: () => void;
  defaultPlatform?: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/tu_usuario', scraper: 'instagram-scraper', urlField: 'instagram_url' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/tu_empresa', scraper: 'linkedin-scraper', urlField: 'linkedin_url' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/tu_pagina', scraper: 'facebook-scraper', urlField: 'facebook_url' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, placeholder: 'https://tiktok.com/@tu_usuario', scraper: 'tiktok-scraper', urlField: 'tiktok_url' },
];

export function SocialDataImportDialog({
  open,
  onOpenChange,
  userId,
  companyId,
  onSuccess,
  defaultPlatform
}: SocialDataImportDialogProps) {
  const { t } = useTranslation(['common', 'marketing']);
  const [platform, setPlatform] = useState(defaultPlatform || '');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyUrls, setCompanyUrls] = useState<Record<string, string>>({});

  // Fetch company social URLs when dialog opens
  useEffect(() => {
    if (!open || !companyId) return;
    const fetchUrls = async () => {
      const { data } = await supabase
        .from('companies')
        .select('instagram_url, linkedin_url, facebook_url, tiktok_url')
        .eq('id', companyId)
        .maybeSingle();
      if (data) {
        setCompanyUrls({
          instagram: data.instagram_url || '',
          linkedin: data.linkedin_url || '',
          facebook: data.facebook_url || '',
          tiktok: data.tiktok_url || '',
        });
      }
    };
    fetchUrls();
  }, [open, companyId]);

  // Auto-fill URL when platform changes
  useEffect(() => {
    if (platform && companyUrls[platform]) {
      setUrl(companyUrls[platform]);
    }
  }, [platform, companyUrls]);

  const selectedPlatform = PLATFORMS.find(p => p.id === platform);

  const handleImport = async () => {
    if (!platform || !url) {
      setError('Por favor selecciona una plataforma e ingresa la URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Por favor ingresa una URL válida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scraperFunction = selectedPlatform?.scraper;
      if (!scraperFunction) {
        throw new Error('Scraper no disponible para esta plataforma');
      }

      const { data, error: fnError } = await supabase.functions.invoke(scraperFunction, {
        body: {
          user_id: userId,
          company_id: companyId,
          profile_url: url,
          url: url // Some scrapers use 'url' instead of 'profile_url'
        }
      });

      if (fnError) throw fnError;

      const postsImported = data?.posts_count || data?.posts?.length || 0;
      
      toast.success(
        `Datos importados de ${selectedPlatform?.name}`,
        { description: `${postsImported} publicaciones encontradas` }
      );

      onSuccess?.();
      onOpenChange(false);
      setUrl('');
      setPlatform('');
    } catch (err: any) {
      console.error('Error importing social data:', err);
      setError(err.message || 'Error al importar datos. Verifica la URL e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Importar Datos de Redes Sociales
          </DialogTitle>
          <DialogDescription>
            Ingresa la URL de tu perfil o página para importar publicaciones y datos de engagement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Selecciona una plataforma" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <p.icon className="h-4 w-4" />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL del Perfil o Página</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={selectedPlatform?.placeholder || 'https://...'}
              disabled={!platform || loading}
            />
            {platform && (
              <p className="text-xs text-muted-foreground">
                Ejemplo: {selectedPlatform?.placeholder}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!platform || !url || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar Datos'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
