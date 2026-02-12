import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, User, Copy, LayoutGrid } from "lucide-react";
import { VideoGenerationForm } from "./VideoGenerationForm";
import { AvatarVideoForm } from "./AvatarVideoForm";
import { AdCloneForm } from "./AdCloneForm";
import { IABBannerForm } from "./IABBannerForm";
import { CreatifyGallery } from "./CreatifyGallery";
import { useCompany } from "@/contexts/CompanyContext";

interface CreatifyStudioProps {
  campaignId?: string;
  campaignObjective?: string;
  targetPlatform?: string;
  initialScript?: string;
}

export const CreatifyStudio = ({
  campaignId,
  campaignObjective,
  targetPlatform,
  initialScript,
}: CreatifyStudioProps) => {
  const { t } = useTranslation("creatify");
  const { company } = useCompany();

  if (!company) {
    return <p className="text-muted-foreground text-center py-8">{t("errors.noCompany")}</p>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="video-ad" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
          <TabsTrigger value="video-ad" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Video className="h-4 w-4" /> {t("tabs.videoAd")}
          </TabsTrigger>
          <TabsTrigger value="avatar" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <User className="h-4 w-4" /> {t("tabs.avatar")}
          </TabsTrigger>
          <TabsTrigger value="ad-clone" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Copy className="h-4 w-4" /> {t("tabs.adClone")}
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutGrid className="h-4 w-4" /> {t("tabs.banners")}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="text-xs sm:text-sm">
            {t("tabs.gallery")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video-ad">
          <VideoGenerationForm
            companyId={company.id}
            websiteUrl={company.website_url || ""}
            campaignId={campaignId}
            campaignObjective={campaignObjective}
            targetPlatform={targetPlatform}
          />
        </TabsContent>

        <TabsContent value="avatar">
          <AvatarVideoForm
            companyId={company.id}
            campaignId={campaignId}
            initialScript={initialScript}
          />
        </TabsContent>

        <TabsContent value="ad-clone">
          <AdCloneForm
            companyId={company.id}
            websiteUrl={company.website_url || ""}
            campaignId={campaignId}
          />
        </TabsContent>

        <TabsContent value="banners">
          <IABBannerForm
            companyId={company.id}
            campaignId={campaignId}
            brandName={company.name}
          />
        </TabsContent>

        <TabsContent value="gallery">
          <CreatifyGallery companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
