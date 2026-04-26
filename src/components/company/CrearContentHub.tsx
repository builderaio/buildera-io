import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import ContentCreatorTab from "./ContentCreatorTab";
import ContentCalendar from "./ContentCalendar";
import { CampaignDashboard } from "./campaign/CampaignDashboard";
import { CreatifyStudio } from "./creatify/CreatifyStudio";
import { SmartLinkBuilder } from "./marketing/SmartLinkBuilder";
import { UnifiedLibrary } from "./UnifiedLibrary";
import { ReportBuilder } from "./marketing/ReportBuilder";
import { SocialListeningPanel } from "./marketing/SocialListeningPanel";
import { UTMDashboard } from "./marketing/UTMDashboard";
import { SocialAutomationRules } from "./marketing/SocialAutomationRules";
import { AutoDMMonitors } from "./marketing/AutoDMMonitors";
import { WebhookEventsLog } from "./marketing/WebhookEventsLog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CrearContentHubProps {
  profile: any;
  selectedPlatform: string;
  onNavigateTab: (tab: string) => void;
}

type ActiveView = null | "campaign" | "creative-studio" | "smart-links" | "library" | "reports" | "listening" | "utm" | "automation" | "autodm" | "events";

const ADVANCED_TOOLS = [
  { id: "campaign" as ActiveView, labelKey: "hub.crear.campaign.title", icon: "🎯" },
  { id: "creative-studio" as ActiveView, labelKey: "hub.crear.studio.title", icon: "🎬" },
  { id: "smart-links" as ActiveView, labelKey: "hub.crear.smartLinks.title", icon: "🔗" },
  { id: "library" as ActiveView, labelKey: "hub.advancedTools.library", icon: "📚" },
  { id: "reports" as ActiveView, labelKey: "hub.advancedTools.reports", icon: "📊" },
  { id: "listening" as ActiveView, labelKey: "hub.advancedTools.listening", icon: "👂" },
  { id: "utm" as ActiveView, labelKey: "hub.advancedTools.attribution", icon: "🏷️" },
  { id: "automation" as ActiveView, labelKey: "hub.advancedTools.automation", icon: "⚙️" },
  { id: "autodm" as ActiveView, labelKey: "hub.advancedTools.autodm", icon: "💬" },
  { id: "events" as ActiveView, labelKey: "hub.advancedTools.events", icon: "📡" },
];

export const CrearContentHub = ({ profile, selectedPlatform, onNavigateTab }: CrearContentHubProps) => {
  const { t } = useTranslation("marketing");
  const [activeView, setActiveView] = useState<ActiveView>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mainView, setMainView] = useState<"create" | "calendar">("create");

  // Render advanced tool views with back button
  if (activeView) {
    const renderView = () => {
      switch (activeView) {
        case "campaign": return <CampaignDashboard />;
        case "creative-studio": return <CreatifyStudio />;
        case "smart-links": return <SmartLinkBuilder companyId={profile?.company_id || ""} onBack={() => setActiveView(null)} />;
        case "library": return <UnifiedLibrary profile={profile} />;
        case "reports": return <ReportBuilder profile={profile} companyId={profile?.company_id} />;
        case "listening": return <SocialListeningPanel profile={profile} companyId={profile?.company_id} />;
        case "utm": return <UTMDashboard companyId={profile?.company_id} />;
        case "automation": return <SocialAutomationRules companyId={profile?.company_id} />;
        case "autodm": return <AutoDMMonitors companyId={profile?.company_id} />;
        case "events": return <WebhookEventsLog companyId={profile?.company_id} />;
        default: return null;
      }
    };

    return (
      <div className="space-y-4">
        {activeView !== "smart-links" && (
          <Button variant="ghost" size="sm" onClick={() => setActiveView(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("hub.crear.back")}
          </Button>
        )}
        {renderView()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle: Create / Calendar */}
      <Tabs value={mainView} onValueChange={(v) => setMainView(v as "create" | "calendar")}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="create" className="gap-2">
            ✏️ {t("hub.tabs.create")}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            {t("hub.tabs.calendar")}
          </TabsTrigger>
        </TabsList>

        {/* Direct Content Creator — no intermediate card selection */}
        <TabsContent value="create" className="mt-6">
          <ContentCreatorTab
            profile={profile}
            topPosts={[]}
            selectedPlatform={selectedPlatform}
          />
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar profile={profile} />
        </TabsContent>
      </Tabs>

      {/* Advanced Tools — Collapsible */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {t("hub.advancedTools.title", "Herramientas avanzadas")}
            </span>
            {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ADVANCED_TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant="outline"
                className="h-auto py-3 flex-col gap-1.5 text-xs"
                onClick={() => setActiveView(tool.id)}
              >
                <span className="text-lg">{tool.icon}</span>
                <span>{t(tool.labelKey)}</span>
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
