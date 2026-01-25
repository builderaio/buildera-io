import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CreditCard, Bell, Users, Bot } from "lucide-react";
import AuthMethodManager from "@/components/auth/AuthMethodManager";
import PlanSubscription from "./PlanSubscription";
import NotificationPreferences from "./NotificationPreferences";
import { ADNTeamTab, ADNAgentPrefsSimplified } from "./adn-tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConfiguracionProps {
  profile: any;
  resetTutorial?: () => Promise<void>;
}

const Configuracion = ({ profile, resetTutorial }: ConfiguracionProps) => {
  const { t } = useTranslation("common");
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanyId = async () => {
      if (!profile?.user_id) return;
      
      // Try to get company ID from profile or company_members
      const { data: profileData } = await supabase
        .from('profiles')
        .select('primary_company_id')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      if (profileData?.primary_company_id) {
        setCompanyId(profileData.primary_company_id);
        return;
      }

      const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile.user_id)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (member?.company_id) {
        setCompanyId(member.company_id);
      }
    };

    loadCompanyId();
  }, [profile?.user_id]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">{t("config.title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("config.subtitle")}
        </p>
      </header>

      <Card>
        <CardContent className="p-6 md:p-8">
          <Tabs defaultValue="security" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm">
                <Shield className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.security")}
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2 text-xs sm:text-sm">
                <Users className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.team", "Equipo")}
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2 text-xs sm:text-sm">
                <Bot className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.agents", "Agentes")}
              </TabsTrigger>
              <TabsTrigger value="plan" className="gap-2 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.plan")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
                <Bell className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.notifications", "Alertas")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="mt-0">
              <AuthMethodManager />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <ADNTeamTab />
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              {companyId ? (
                <ADNAgentPrefsSimplified companyId={companyId} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("common:status.loading")}
                </div>
              )}
            </TabsContent>

            <TabsContent value="plan" className="mt-0">
              <PlanSubscription />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracion;
