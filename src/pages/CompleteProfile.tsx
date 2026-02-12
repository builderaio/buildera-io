import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CompleteProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { t } = useTranslation("auth");
  
  // Developer fields
  const [githubUrl, setGithubUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // Expert fields
  const [industry, setIndustry] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const industryKeys = [
    "technology", "finance", "health", "education", "retail", 
    "manufacturing", "consulting", "marketing", "humanResources", "other"
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setFullName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");
      
      // Pre-fill company data from signup metadata
      const metaCompany = session.user.user_metadata?.company_name;
      const metaWebsite = session.user.user_metadata?.website_url;
      if (metaCompany) setCompanyName(metaCompany);
      if (metaWebsite) setWebsiteUrl(metaWebsite);

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Cargar estado de onboarding
      const { data: onboarding } = await supabase
        .from('user_onboarding_status')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Prefijar tipo si existe desde el perfil
      if (profile?.user_type && !userType) {
        setUserType(profile.user_type);
      }

      // Check URL params for user type from OAuth or social callback
      const typeParam = searchParams.get('user_type');
      if (typeParam && ['company', 'developer', 'expert'].includes(typeParam)) {
        console.log('🔍 CompleteProfile: user_type from URL:', typeParam);
        setUserType(typeParam);
      }

      // Check if this is a provider linking action
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
        console.error('Error updating auth provider:', error);
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
        user_type: userType
      };

      if (userType === 'developer') {
        profileData.github_url = githubUrl;
        profileData.skills = skills ? skills.split(',').map(s => s.trim()) : [];
        profileData.experience_years = experienceYears ? parseInt(experienceYears) : null;
      } else if (userType === 'expert') {
        profileData.expertise_areas = expertiseAreas ? expertiseAreas.split(',').map(s => s.trim()) : [];
        profileData.years_experience = yearsExperience ? parseInt(yearsExperience) : null;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      if (userType === 'company') {
        try {
          const { data: companyData, error: companyError } = await supabase.rpc('create_company_with_owner', {
            company_name: companyName,
            company_description: '',
            website_url: websiteUrl || null,
            user_id_param: user.id
          });

          if (companyError) {
            console.error('Error creating company:', companyError);
            throw companyError;
          }
          console.log('✅ Company created:', companyData);
        } catch (companyError) {
          console.error('❌ Company creation error:', companyError);
        }
      }

      const provider = (user.app_metadata?.provider as string) || 'email';
      try {
        await supabase.from('user_onboarding_status').upsert({
          user_id: user.id,
          first_login_completed: true,
          registration_method: provider === 'email' ? 'email' : 'social'
        });
      } catch (e) {
        console.warn('Could not update user_onboarding_status:', e);
      }

      toast({
        title: t("completeProfile.successTitle"),
        description: t("completeProfile.successDesc"),
      });

      if (userType === 'company') {
        navigate('/company-dashboard?view=onboarding&first_login=true');
      } else if (userType === 'developer') {
        navigate('/company-dashboard?view=onboarding&first_login=true&user_type=developer');
      } else if (userType === 'expert') {
        navigate('/company-dashboard?view=onboarding&first_login=true&user_type=expert');
      } else {
        navigate('/company-dashboard?view=onboarding&first_login=true');
      }
      
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
              {!searchParams.get('user_type') && (
                <div className="space-y-2">
                  <Label htmlFor="userType">{t("completeProfile.userType")}</Label>
                  <Select value={userType} onValueChange={setUserType} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("completeProfile.selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">{t("completeProfile.developer")}</SelectItem>
                      <SelectItem value="expert">{t("completeProfile.expert")}</SelectItem>
                      <SelectItem value="company">{t("completeProfile.business")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              {userType === 'developer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">{t("form.githubUrl")}</Label>
                    <Input
                      id="githubUrl"
                      type="text"
                      placeholder={t("form.githubUrlPlaceholder")}
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">{t("form.skills")}</Label>
                    <Input
                      id="skills"
                      type="text"
                      placeholder={t("form.skillsPlaceholder")}
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">{t("form.experienceYears")}</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      placeholder={t("form.experienceYearsPlaceholder")}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {userType === 'expert' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="industry">{t("form.industry")}</Label>
                    <Select value={industry} onValueChange={setIndustry} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.industryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {industryKeys.map((key) => (
                          <SelectItem key={key} value={t(`industries.${key}`)}>
                            {t(`industries.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expertiseAreas">{t("form.expertiseAreas")}</Label>
                    <Input
                      id="expertiseAreas"
                      type="text"
                      placeholder={t("form.expertiseAreasPlaceholder")}
                      value={expertiseAreas}
                      onChange={(e) => setExpertiseAreas(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">{t("form.yearsExperience")}</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      placeholder={t("form.yearsExperiencePlaceholder")}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {userType === 'company' && (
                <>
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
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading || !userType}>
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