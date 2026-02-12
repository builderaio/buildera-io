import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PenTool, Megaphone, Video, ArrowLeft, Sparkles, Link2, Mail
} from "lucide-react";
import ContentCreatorTab from "./ContentCreatorTab";
import { CampaignDashboard } from "./campaign/CampaignDashboard";
import { CreatifyStudio } from "./creatify/CreatifyStudio";
import { SmartLinkBuilder } from "./marketing/SmartLinkBuilder";

interface CrearContentHubProps {
  profile: any;
  selectedPlatform: string;
  onNavigateTab: (tab: string) => void;
}

type CreationPath = null | "quick-post" | "campaign" | "creative-studio" | "smart-links" | "email-sequence";

export const CrearContentHub = ({ profile, selectedPlatform, onNavigateTab }: CrearContentHubProps) => {
  const { t } = useTranslation("marketing");
  const [activePath, setActivePath] = useState<CreationPath>(null);

  if (activePath === "quick-post") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActivePath(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("hub.crear.back")}
        </Button>
        <ContentCreatorTab
          profile={profile}
          topPosts={[]}
          selectedPlatform={selectedPlatform}
        />
      </div>
    );
  }

  if (activePath === "campaign") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActivePath(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("hub.crear.back")}
        </Button>
        <CampaignDashboard />
      </div>
    );
  }

  if (activePath === "creative-studio") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActivePath(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("hub.crear.back")}
        </Button>
        <CreatifyStudio />
      </div>
    );
  }

  if (activePath === "smart-links") {
    return (
      <div className="space-y-4">
        <SmartLinkBuilder
          companyId={profile?.company_id || ""}
          onBack={() => setActivePath(null)}
        />
      </div>
    );
  }

  const paths = [
    {
      id: "quick-post" as CreationPath,
      icon: PenTool,
      titleKey: "hub.crear.quickPost.title",
      descKey: "hub.crear.quickPost.description",
      features: ["hub.crear.quickPost.f1", "hub.crear.quickPost.f2", "hub.crear.quickPost.f3"],
      gradient: "from-primary/10 to-blue-500/10",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      id: "campaign" as CreationPath,
      icon: Megaphone,
      titleKey: "hub.crear.campaign.title",
      descKey: "hub.crear.campaign.description",
      features: ["hub.crear.campaign.f1", "hub.crear.campaign.f2", "hub.crear.campaign.f3"],
      gradient: "from-orange-500/10 to-red-500/10",
      iconBg: "bg-orange-500/10 text-orange-600",
    },
    {
      id: "creative-studio" as CreationPath,
      icon: Video,
      titleKey: "hub.crear.studio.title",
      descKey: "hub.crear.studio.description",
      features: ["hub.crear.studio.f1", "hub.crear.studio.f2", "hub.crear.studio.f3"],
      gradient: "from-purple-500/10 to-pink-500/10",
      iconBg: "bg-purple-500/10 text-purple-600",
    },
    {
      id: "smart-links" as CreationPath,
      icon: Link2,
      titleKey: "hub.crear.smartLinks.title",
      descKey: "hub.crear.smartLinks.description",
      features: ["hub.crear.smartLinks.f1", "hub.crear.smartLinks.f2", "hub.crear.smartLinks.f3"],
      gradient: "from-emerald-500/10 to-teal-500/10",
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "email-sequence" as CreationPath,
      icon: Mail,
      titleKey: "hub.crear.emailSequence.title",
      descKey: "hub.crear.emailSequence.description",
      features: ["hub.crear.emailSequence.f1", "hub.crear.emailSequence.f2", "hub.crear.emailSequence.f3"],
      gradient: "from-cyan-500/10 to-blue-500/10",
      iconBg: "bg-cyan-500/10 text-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t("hub.crear.title")}
        </h2>
        <p className="text-muted-foreground mt-1">{t("hub.crear.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.map((path) => {
          const Icon = path.icon;
          return (
            <Card
              key={path.id}
              className={`group cursor-pointer border-2 hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${path.gradient}`}
              onClick={() => setActivePath(path.id)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${path.iconBg} mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{t(path.titleKey)}</CardTitle>
                <CardDescription>{t(path.descKey)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {path.features.map((fKey) => (
                    <li key={fKey} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {t(fKey)}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  {t("hub.crear.start")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
