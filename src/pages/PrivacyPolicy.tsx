import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, FileCheck, UserCheck, Globe, Bell } from "lucide-react";
import { useGTM } from "@/hooks/useGTM";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  useGTM();
  const { t } = useTranslation('legal');

  const personalInfoItems = t('privacy.personalInfoItems', { returnObjects: true }) as string[];
  const usageInfoItems = t('privacy.usageInfoItems', { returnObjects: true }) as string[];
  const allowedUsesItems = t('privacy.allowedUsesItems', { returnObjects: true }) as string[];
  const neverDoItems = t('privacy.neverDoItems', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToHome')}
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <h1 className="text-xl font-bold">Buildera</h1>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2">
              <Shield className="w-3 h-3" />
              {t('lastUpdated')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('privacy.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('privacy.subtitle')}
          </p>
        </div>

        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              {t('privacy.securityCommitments')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">{t('privacy.encryption')}</h4>
                  <p className="text-sm text-muted-foreground">{t('privacy.encryptionDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">{t('privacy.secureAuth')}</h4>
                  <p className="text-sm text-muted-foreground">{t('privacy.secureAuthDesc')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">{t('privacy.gdprCompliance')}</h4>
                  <p className="text-sm text-muted-foreground">{t('privacy.gdprComplianceDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">{t('privacy.regularAudits')}</h4>
                  <p className="text-sm text-muted-foreground">{t('privacy.regularAuditsDesc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-5 h-5" />
                {t('privacy.section1Title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{t('privacy.personalInfo')}</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {Array.isArray(personalInfoItems) && personalInfoItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('privacy.usageInfo')}</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {Array.isArray(usageInfoItems) && usageInfoItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  🔒 <strong>{t('privacy.privacyGuarantee')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-5 h-5" />
                {t('privacy.section2Title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-primary">✅ {t('privacy.allowedUses')}</h4>
                  <ul className="space-y-2 text-sm">
                    {Array.isArray(allowedUsesItems) && allowedUsesItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-destructive">❌ {t('privacy.neverDo')}</h4>
                  <ul className="space-y-2 text-sm">
                    {Array.isArray(neverDoItems) && neverDoItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-2"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                {t('privacy.section3Title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">{t('privacy.technicalMeasures')}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">{t('privacy.encryptionDetail')}</h5>
                    <p className="text-sm text-muted-foreground">{t('privacy.encryptionDetailDesc')}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">{t('privacy.infrastructure')}</h5>
                    <p className="text-sm text-muted-foreground">{t('privacy.infrastructureDesc')}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">{t('privacy.access')}</h5>
                    <p className="text-sm text-muted-foreground">{t('privacy.accessDesc')}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">{t('privacy.monitoring')}</h5>
                    <p className="text-sm text-muted-foreground">{t('privacy.monitoringDesc')}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">{t('privacy.dataLocation')}</h4>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <strong>{t('privacy.mainServers')}</strong><br/>
                    <strong>{t('privacy.backups')}</strong><br/>
                    <strong>{t('privacy.compliance')}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="w-5 h-5" />
                {t('privacy.section4Title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary">{t('privacy.rightAccess')}</h4>
                    <p className="text-sm text-muted-foreground">{t('privacy.rightAccessDesc')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{t('privacy.rightRectification')}</h4>
                    <p className="text-sm text-muted-foreground">{t('privacy.rightRectificationDesc')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{t('privacy.rightDeletion')}</h4>
                    <p className="text-sm text-muted-foreground">{t('privacy.rightDeletionDesc')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary">{t('privacy.rightPortability')}</h4>
                    <p className="text-sm text-muted-foreground">{t('privacy.rightPortabilityDesc')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{t('privacy.rightOpposition')}</h4>
                    <p className="text-sm text-muted-foreground">{t('privacy.rightOppositionDesc')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{t('privacy.rightLimitation')}</h4>
                    <p className="text-sm text-muted-foreground">{t('privacy.rightLimitationDesc')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                {t('privacy.section5Title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{t('privacy.dpo')}</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>{t('privacy.email')}</strong><br/>
                    <strong>{t('privacy.responseTime')}</strong><br/>
                    <strong>{t('privacy.resolution')}</strong>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('privacy.policyUpdates')}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('privacy.policyUpdatesDesc')}
                </p>
                <Badge variant="outline" className="gap-2">
                  <FileCheck className="w-3 h-3" />
                  {t('privacy.version')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('privacy.footerNote')}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/">
              <Button variant="outline">{t('backToHome')}</Button>
            </Link>
            <Link to="/company-dashboard">
              <Button>{t('goToDashboard')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
