import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CreditCard, Bell } from "lucide-react";
import AuthMethodManager from "@/components/auth/AuthMethodManager";
import PlanSubscription from "./PlanSubscription";
import NotificationPreferences from "./NotificationPreferences";

interface ConfiguracionProps {
  profile: any;
  resetTutorial?: () => Promise<void>;
}

const Configuracion = ({ profile, resetTutorial }: ConfiguracionProps) => {
  const { t } = useTranslation("common");

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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.security")}
              </TabsTrigger>
              <TabsTrigger value="plan" className="gap-2">
                <CreditCard className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.plan")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4 hidden sm:block" />
                {t("config.tabs.notifications")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="mt-0">
              <AuthMethodManager />
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
