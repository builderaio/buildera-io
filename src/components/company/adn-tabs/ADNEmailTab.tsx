import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Server, 
  Inbox, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Receipt,
  Bell,
  HeadphonesIcon,
  Megaphone,
  AtSign
} from 'lucide-react';
import { useCompanyEmail } from '@/hooks/useCompanyEmail';
import { Skeleton } from '@/components/ui/skeleton';

interface ADNEmailTabProps {
  companyData: any;
}

export const ADNEmailTab: React.FC<ADNEmailTabProps> = ({ companyData }) => {
  const { t } = useTranslation('common');
  const { 
    config, 
    loading, 
    saving, 
    testing, 
    connectionStatus,
    saveConfig, 
    testConnection, 
    updateField 
  } = useCompanyEmail(companyData?.id);

  const handleSave = async () => {
    if (config) {
      await saveConfig(config);
    }
  };

  const handleBlur = async (field: string, value: any) => {
    if (config && config[field as keyof typeof config] !== value) {
      await saveConfig({ [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    );
  }

  const mailboxes = [
    { key: 'billing_email', icon: Receipt, label: t('adn.email.mailboxes.billing'), description: t('adn.email.mailboxes.billingDesc') },
    { key: 'notifications_email', icon: Bell, label: t('adn.email.mailboxes.notifications'), description: t('adn.email.mailboxes.notificationsDesc') },
    { key: 'support_email', icon: HeadphonesIcon, label: t('adn.email.mailboxes.support'), description: t('adn.email.mailboxes.supportDesc') },
    { key: 'marketing_email', icon: Megaphone, label: t('adn.email.mailboxes.marketing'), description: t('adn.email.mailboxes.marketingDesc') },
    { key: 'general_email', icon: AtSign, label: t('adn.email.mailboxes.general'), description: t('adn.email.mailboxes.generalDesc') },
  ];

  return (
    <div className="space-y-6">
      {/* SMTP Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            {t('adn.email.smtpSection')}
          </CardTitle>
          <CardDescription>{t('adn.email.smtpDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">{t('adn.email.smtpHost')}</Label>
              <Input
                id="smtp_host"
                placeholder="smtp.example.com"
                value={config?.smtp_host || ''}
                onChange={(e) => updateField('smtp_host', e.target.value)}
                onBlur={(e) => handleBlur('smtp_host', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">{t('adn.email.smtpPort')}</Label>
              <Input
                id="smtp_port"
                type="number"
                placeholder="587"
                value={config?.smtp_port || 587}
                onChange={(e) => updateField('smtp_port', parseInt(e.target.value) || 587)}
                onBlur={(e) => handleBlur('smtp_port', parseInt(e.target.value) || 587)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_user">{t('adn.email.smtpUser')}</Label>
              <Input
                id="smtp_user"
                placeholder="user@example.com"
                value={config?.smtp_user || ''}
                onChange={(e) => updateField('smtp_user', e.target.value)}
                onBlur={(e) => handleBlur('smtp_user', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">{t('adn.email.smtpPassword')}</Label>
              <Input
                id="smtp_password"
                type="password"
                placeholder="••••••••"
                value={config?.smtp_password || ''}
                onChange={(e) => updateField('smtp_password', e.target.value)}
                onBlur={(e) => handleBlur('smtp_password', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="smtp_secure"
                checked={config?.smtp_secure ?? true}
                onCheckedChange={(checked) => {
                  updateField('smtp_secure', checked);
                  saveConfig({ smtp_secure: checked });
                }}
              />
              <Label htmlFor="smtp_secure">{t('adn.email.smtpSecure')}</Label>
            </div>

            <div className="flex items-center gap-3">
              {connectionStatus === 'success' && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">{t('adn.email.connected')}</span>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{t('adn.email.connectionFailed')}</span>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={testing || !config?.smtp_host}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Server className="h-4 w-4 mr-2" />
                )}
                {t('adn.email.testConnection')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Mailboxes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            {t('adn.email.mailboxesSection')}
          </CardTitle>
          <CardDescription>{t('adn.email.mailboxesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mailboxes.map((mailbox, index) => (
            <React.Fragment key={mailbox.key}>
              {index > 0 && <Separator />}
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <mailbox.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor={mailbox.key} className="text-sm font-medium">
                    {mailbox.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{mailbox.description}</p>
                </div>
                <div className="w-64">
                  <Input
                    id={mailbox.key}
                    type="email"
                    placeholder={`${mailbox.key.replace('_email', '')}@${companyData?.name?.toLowerCase().replace(/\s+/g, '') || 'empresa'}.com`}
                    value={config?.[mailbox.key as keyof typeof config] as string || ''}
                    onChange={(e) => updateField(mailbox.key as any, e.target.value)}
                    onBlur={(e) => handleBlur(mailbox.key, e.target.value)}
                  />
                </div>
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      {/* Sender Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {t('adn.email.senderSection')}
          </CardTitle>
          <CardDescription>{t('adn.email.senderDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_name">{t('adn.email.fromName')}</Label>
              <Input
                id="from_name"
                placeholder={companyData?.name || 'Mi Empresa'}
                value={config?.from_name || ''}
                onChange={(e) => updateField('from_name', e.target.value)}
                onBlur={(e) => handleBlur('from_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email">{t('adn.email.fromEmail')}</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@empresa.com"
                value={config?.from_email || ''}
                onChange={(e) => updateField('from_email', e.target.value)}
                onBlur={(e) => handleBlur('from_email', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={config?.is_active ?? false}
                onCheckedChange={(checked) => {
                  updateField('is_active', checked);
                  saveConfig({ is_active: checked });
                }}
              />
              <Label htmlFor="is_active">{t('adn.email.activeSending')}</Label>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {t('adn.email.saveConfig')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
