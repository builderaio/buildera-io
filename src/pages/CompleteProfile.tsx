import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CompleteProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { t } = useTranslation("auth");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setFullName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");
      
      const metaCompany = session.user.user_metadata?.company_name;
      const metaWebsite = session.user.user_metadata?.website_url;
      if (metaCompany) setCompanyName(metaCompany);
      if (metaWebsite) setWebsiteUrl(metaWebsite);

      // Check URL params for provider linking action
      const action = searchParams.get('action');
      if (action === 'link_provider') {
        await updateAuthProvider(session.user);
      }

      setInitializing(false);
    };

    const updateAuthProvider = async (user: any) => {
      try {
        const provider = user.app_metadata?.provider;
        if (provider && provider !== 'email') {
          await supabase.rpc('add_linked_provider', {
            _user_id: user.id,
            _provider: provider
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error updating auth provider:', error);
      }
    };

    checkAuth();
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const profileData: any = {
        user_id: user.id,
        email: user.email || '',
        full_name: fullName,
        user_type: 'company'
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      try {
        const { data: companyData, error: companyError } = await supabase.rpc('create_company_with_owner', {
          company_name: companyName,
          company_description: '',
          website_url: websiteUrl || null,
          user_id_param: user.id
        });

        if (companyError) {
          if (import.meta.env.DEV) console.error('Error creating company:', companyError);
          throw companyError;
        }
      } catch (companyError) {
        if (import.meta.env.DEV) console.error('Company creation error:', companyError);
      }

      const provider = (user.app_metadata?.provider as string) || 'email';
      try {
        await supabase.from('user_onboarding_status').upsert({
          user_id: user.id,
          first_login_completed: true,
          registration_method: provider === 'email' ? 'email' : 'social'
        });
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Could not update user_onboarding_status:', e);
      }

      toast({
        title: t("completeProfile.successTitle"),
        description: t("completeProfile.successDesc"),
      });

      navigate('/company-dashboard?view=onboarding&first_login=true');
      
    } catch (error: any) {
      toast({
        title: t("messages.authError"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("completeProfile.verifying")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading gradient-text">
            {t("completeProfile.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("completeProfile.subtitle")}
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle>{t("completeProfile.cardTitle")}</CardTitle>
            <CardDescription>
              {t("completeProfile.cardDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("form.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("form.fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">{t("form.companyName")}</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder={t("form.companyNamePlaceholder")}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">{t("form.websiteUrl")}</Label>
                <Input
                  id="websiteUrl"
                  type="text"
                  placeholder={t("form.websiteUrlPlaceholder")}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("completeProfile.saving") : t("completeProfile.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
