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
  { id: 'instagram', name: 'Instagram', icon: Instagram, baseUrl: 'https://instagram.com/', prefix: '', placeholder: 'tu_usuario', scraper: 'instagram-scraper', urlField: 'instagram_url' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, baseUrl: 'https://linkedin.com/company/', prefix: '', placeholder: 'tu_empresa', scraper: 'linkedin-scraper', urlField: 'linkedin_url' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, baseUrl: 'https://facebook.com/', prefix: '', placeholder: 'tu_pagina', scraper: 'facebook-scraper', urlField: 'facebook_url' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, baseUrl: 'https://tiktok.com/@', prefix: '@', placeholder: 'tu_usuario', scraper: 'tiktok-scraper', urlField: 'tiktok_url' },
];

/** Extract username/slug from a full profile URL */
const extractUsernameFromUrl = (platform: string, url: string): string | null => {
  if (!url) return null;
  try {
    const cleaned = url.trim().replace(/\/+$/, '');
    switch (platform) {
      case 'linkedin': {
        const match = cleaned.match(/linkedin\.com\/(company|in)\/([^/?#]+)/i);
        return match ? match[2] : null;
      }
      case 'instagram': {
        const match = cleaned.match(/instagram\.com\/([^/?#]+)/i);
        return match && match[1] !== 'p' ? match[1] : null;
      }
      case 'facebook': {
        const match = cleaned.match(/facebook\.com\/([^/?#]+)/i);
        return match && !['profile.php', 'pages', 'groups'].includes(match[1]) ? match[1] : null;
      }
      case 'tiktok': {
        const match = cleaned.match(/tiktok\.com\/@?([^/?#]+)/i);
        return match ? match[1].replace(/^@/, '') : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
};

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
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUsernames, setResolvedUsernames] = useState<Record<string, string>>({});

  // Fetch pre-filled usernames from companies URLs + social_accounts
  useEffect(() => {
    if (!open || !companyId) return;
    const resolve = async () => {
      const usernames: Record<string, string> = {};

      // 1. From companies table URLs
      const { data: company } = await supabase
        .from('companies')
        .select('instagram_url, linkedin_url, facebook_url, tiktok_url')
        .eq('id', companyId)
        .maybeSingle();

      if (company) {
        const urlMap: Record<string, string | null> = {
          instagram: company.instagram_url,
          linkedin: company.linkedin_url,
          facebook: company.facebook_url,
          tiktok: company.tiktok_url,
        };
        for (const [p, url] of Object.entries(urlMap)) {
          if (url) {
            const extracted = extractUsernameFromUrl(p, url);
            if (extracted) usernames[p] = extracted;
          }
        }
      }

      // 2. Fallback from social_accounts (Upload Post data) for platforms not yet resolved
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform, platform_username')
        .eq('company_id', companyId)
        .eq('is_connected', true);

      if (accounts) {
        for (const acc of accounts) {
          const p = acc.platform;
          // Skip LinkedIn (Upload Post gives internal ID, not public slug)
          if (p === 'linkedin') continue;
          if (!usernames[p] && acc.platform_username) {
            usernames[p] = acc.platform_username;
          }
        }
      }

      setResolvedUsernames(usernames);
    };
    resolve();
  }, [open, companyId]);

  // Auto-fill username when platform changes
  useEffect(() => {
    if (platform && resolvedUsernames[platform]) {
      setUsername(resolvedUsernames[platform]);
    } else {
      setUsername('');
    }
  }, [platform, resolvedUsernames]);

  const selectedPlatform = PLATFORMS.find(p => p.id === platform);

  const buildFullUrl = () => {
    if (!selectedPlatform || !username) return '';
    return `${selectedPlatform.baseUrl}${username.replace(/^@/, '')}`;
  };

  const handleImport = async () => {
    if (!platform || !username.trim()) {
      setError('Por favor selecciona una plataforma e ingresa el nombre de usuario');
      return;
    }

    const fullUrl = buildFullUrl();
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
          profile_url: fullUrl,
          url: fullUrl
        }
      });

      if (fnError) throw fnError;

      // Sync platform_username back to social_accounts
      const cleanUsername = username.replace(/^@/, '').trim();
      const { error: syncError } = await supabase
        .from('social_accounts')
        .update({ platform_username: cleanUsername })
        .eq('company_id', companyId)
        .eq('platform', platform);

      if (syncError) {
        console.warn('Could not sync platform_username:', syncError);
      }

      // Also update the company URL if empty
      if (selectedPlatform?.urlField) {
        const { data: currentCompany } = await supabase
          .from('companies')
          .select(selectedPlatform.urlField)
          .eq('id', companyId)
          .maybeSingle();

        if (currentCompany && !currentCompany[selectedPlatform.urlField]) {
          await supabase
            .from('companies')
            .update({ [selectedPlatform.urlField]: fullUrl })
            .eq('id', companyId);
        }
      }

      const postsImported = data?.posts_count || data?.posts?.length || 0;
      
      toast.success(
        `Datos importados de ${selectedPlatform?.name}`,
        { description: `${postsImported} publicaciones encontradas` }
      );

      onSuccess?.();
      onOpenChange(false);
      setUsername('');
      setPlatform('');
    } catch (err: any) {
      console.error('Error importing social data:', err);
      setError(err.message || 'Error al importar datos. Verifica el nombre de usuario e intenta nuevamente.');
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
            Ingresa el nombre de usuario o página para importar publicaciones y datos de engagement.
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
            <Label htmlFor="username">Nombre de usuario o página</Label>
            <div className="flex items-center gap-0">
              {selectedPlatform && (
                <span className="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs font-mono whitespace-nowrap">
                  {selectedPlatform.baseUrl}
                </span>
              )}
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedPlatform?.placeholder || 'nombre_usuario'}
                disabled={!platform || loading}
                className={selectedPlatform ? 'rounded-l-none' : ''}
              />
            </div>
            {platform && username && (
              <p className="text-xs text-muted-foreground font-mono truncate">
                → {buildFullUrl()}
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
              disabled={!platform || !username.trim() || loading}
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
