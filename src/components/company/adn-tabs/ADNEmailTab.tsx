import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  AtSign,
  Bot,
  Settings2,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sparkles,
  Clock,
  Info
} from 'lucide-react';
import { useCompanyEmail } from '@/hooks/useCompanyEmail';
import { useInboundEmail } from '@/hooks/useInboundEmail';
import { Skeleton } from '@/components/ui/skeleton';

interface ADNEmailTabProps {
  companyData: any;
}

const MAILBOX_TYPES = [
  { key: 'billing', icon: Receipt, color: 'text-green-600' },
  { key: 'notifications', icon: Bell, color: 'text-blue-600' },
  { key: 'support', icon: HeadphonesIcon, color: 'text-purple-600' },
  { key: 'marketing', icon: Megaphone, color: 'text-orange-600' },
  { key: 'general', icon: AtSign, color: 'text-gray-600' },
] as const;

export const ADNEmailTab: React.FC<ADNEmailTabProps> = ({ companyData }) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState('outbound');
  
  // Outbound email hook
  const { 
    config: outboundConfig, 
    loading: outboundLoading, 
    saving: outboundSaving, 
    testing, 
    connectionStatus,
    saveConfig: saveOutboundConfig, 
    testConnection, 
    updateField: updateOutboundField 
  } = useCompanyEmail(companyData?.id);

  // Inbound email hook
  const {
    config: inboundConfig,
    emailStats,
    loading: inboundLoading,
    saving: inboundSaving,
    saveConfig: saveInboundConfig,
    updateMailbox,
  } = useInboundEmail(companyData?.id);

  const handleOutboundBlur = async (field: string, value: any) => {
    if (outboundConfig && outboundConfig[field as keyof typeof outboundConfig] !== value) {
      await saveOutboundConfig({ [field]: value });
    }
  };

  const handleInboundMailboxChange = async (
    mailboxType: 'billing' | 'notifications' | 'support' | 'marketing' | 'general',
    field: 'email' | 'forwarding_enabled' | 'agent_processing',
    value: any
  ) => {
    await updateMailbox(mailboxType, { [field]: value });
  };

  if (outboundLoading || inboundLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Direction Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="outbound" className="flex items-center gap-2 text-base">
            <ArrowUpFromLine className="h-4 w-4" />
            {t('adn.email.outbound.title', 'Emails Salientes')}
          </TabsTrigger>
          <TabsTrigger value="inbound" className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="h-4 w-4" />
            {t('adn.email.inbound.title', 'Emails Entrantes')}
            {emailStats.unread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {emailStats.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* OUTBOUND TAB */}
        <TabsContent value="outbound" className="space-y-6 mt-6">
          {/* SMTP Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-primary" />
                {t('adn.email.smtpSection', 'Servidor SMTP')}
              </CardTitle>
              <CardDescription>
                {t('adn.email.smtpDescription', 'Configura el servidor para enviar emails desde tu empresa')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">{t('adn.email.smtpHost', 'Host')}</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.example.com"
                    value={outboundConfig?.smtp_host || ''}
                    onChange={(e) => updateOutboundField('smtp_host', e.target.value)}
                    onBlur={(e) => handleOutboundBlur('smtp_host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">{t('adn.email.smtpPort', 'Puerto')}</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    placeholder="587"
                    value={outboundConfig?.smtp_port || 587}
                    onChange={(e) => updateOutboundField('smtp_port', parseInt(e.target.value) || 587)}
                    onBlur={(e) => handleOutboundBlur('smtp_port', parseInt(e.target.value) || 587)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">{t('adn.email.smtpUser', 'Usuario')}</Label>
                  <Input
                    id="smtp_user"
                    placeholder="user@example.com"
                    value={outboundConfig?.smtp_user || ''}
                    onChange={(e) => updateOutboundField('smtp_user', e.target.value)}
                    onBlur={(e) => handleOutboundBlur('smtp_user', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">{t('adn.email.smtpPassword', 'Contraseña')}</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="••••••••"
                    value={outboundConfig?.smtp_password || ''}
                    onChange={(e) => updateOutboundField('smtp_password', e.target.value)}
                    onBlur={(e) => handleOutboundBlur('smtp_password', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp_secure"
                    checked={outboundConfig?.smtp_secure ?? true}
                    onCheckedChange={(checked) => {
                      updateOutboundField('smtp_secure', checked);
                      saveOutboundConfig({ smtp_secure: checked });
                    }}
                  />
                  <Label htmlFor="smtp_secure">{t('adn.email.smtpSecure', 'Conexión segura (TLS)')}</Label>
                </div>

                <div className="flex items-center gap-3">
                  {connectionStatus === 'success' && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t('adn.email.connected', 'Conectado')}
                    </Badge>
                  )}
                  {connectionStatus === 'error' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {t('adn.email.connectionFailed', 'Error')}
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testConnection}
                    disabled={testing || !outboundConfig?.smtp_host}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Server className="h-4 w-4 mr-2" />
                    )}
                    {t('adn.email.testConnection', 'Probar')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-primary" />
                {t('adn.email.senderSection', 'Remitente')}
              </CardTitle>
              <CardDescription>
                {t('adn.email.senderDescription', 'Nombre y dirección que aparecerá en los emails enviados')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_name">{t('adn.email.fromName', 'Nombre')}</Label>
                  <Input
                    id="from_name"
                    placeholder={companyData?.name || 'Mi Empresa'}
                    value={outboundConfig?.from_name || ''}
                    onChange={(e) => updateOutboundField('from_name', e.target.value)}
                    onBlur={(e) => handleOutboundBlur('from_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">{t('adn.email.fromEmail', 'Email')}</Label>
                  <Input
                    id="from_email"
                    type="email"
                    placeholder="noreply@empresa.com"
                    value={outboundConfig?.from_email || ''}
                    onChange={(e) => updateOutboundField('from_email', e.target.value)}
                    onBlur={(e) => handleOutboundBlur('from_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is_active"
                  checked={outboundConfig?.is_active ?? false}
                  onCheckedChange={(checked) => {
                    updateOutboundField('is_active', checked);
                    saveOutboundConfig({ is_active: checked });
                  }}
                />
                <Label htmlFor="is_active">{t('adn.email.activeSending', 'Activar envío de emails')}</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INBOUND TAB */}
        <TabsContent value="inbound" className="space-y-6 mt-6">
          {/* Inbound Status Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              {t('adn.email.inbound.setupRequired', 'Configuración de Buzones de Entrada')}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {t('adn.email.inbound.setupDescription', 'Los buzones de entrada permitirán que agentes de IA procesen emails automáticamente (facturas, soporte, etc.). Requiere integración con SendGrid Inbound Parse.')}
            </AlertDescription>
          </Alert>

          {/* Inbound Mailboxes */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Inbox className="h-5 w-5 text-primary" />
                    {t('adn.email.inbound.mailboxesSection', 'Buzones de Entrada')}
                  </CardTitle>
                  <CardDescription>
                    {t('adn.email.inbound.mailboxesDescription', 'Configura direcciones para recibir emails y habilita procesamiento por IA')}
                  </CardDescription>
                </div>
                <Badge variant={inboundConfig?.is_active ? 'default' : 'secondary'}>
                  {inboundConfig?.is_active 
                    ? t('adn.email.inbound.active', 'Activo') 
                    : t('adn.email.inbound.inactive', 'Inactivo')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {MAILBOX_TYPES.map((mailbox, index) => {
                const mailboxConfig = inboundConfig?.[mailbox.key];
                const Icon = mailbox.icon;
                const emailCount = emailStats.byMailbox[mailbox.key] || 0;
                
                return (
                  <React.Fragment key={mailbox.key}>
                    {index > 0 && <Separator />}
                    <div className="py-3">
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-muted ${mailbox.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium flex items-center gap-2">
                                {t(`adn.email.mailboxes.${mailbox.key}`, mailbox.key)}
                                {emailCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {emailCount} {t('adn.email.inbound.emails', 'emails')}
                                  </Badge>
                                )}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t(`adn.email.inbound.${mailbox.key}Purpose`, getPurposeDescription(mailbox.key))}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Input
                                type="email"
                                placeholder={`${mailbox.key}@${companyData?.name?.toLowerCase().replace(/\s+/g, '') || 'empresa'}.com`}
                                value={mailboxConfig?.email || ''}
                                onChange={(e) => {
                                  // Update local state immediately for responsiveness
                                }}
                                onBlur={(e) => handleInboundMailboxChange(mailbox.key, 'email', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`${mailbox.key}_agent`}
                                  checked={mailboxConfig?.agent_processing ?? false}
                                  onCheckedChange={(checked) => 
                                    handleInboundMailboxChange(mailbox.key, 'agent_processing', checked)
                                  }
                                  disabled={!inboundConfig?.is_active}
                                />
                                <Label 
                                  htmlFor={`${mailbox.key}_agent`} 
                                  className="text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Bot className="h-3 w-3" />
                                  {t('adn.email.inbound.agentProcessing', 'IA')}
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="h-5 w-5 text-primary" />
                {t('adn.email.inbound.integrationSection', 'Integración SendGrid')}
              </CardTitle>
              <CardDescription>
                {t('adn.email.inbound.integrationDescription', 'Configuración para recibir emails vía SendGrid Inbound Parse')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  {t('adn.email.inbound.comingSoon', 'Próximamente')}
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  {t('adn.email.inbound.comingSoonDescription', 'La integración con SendGrid Inbound Parse estará disponible próximamente. Por ahora, puedes configurar las direcciones de email que planeas usar.')}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                <div className="space-y-2">
                  <Label>{t('adn.email.inbound.parseDomain', 'Dominio de Parse')}</Label>
                  <Input
                    placeholder="parse.tudominio.com"
                    value={inboundConfig?.sendgrid_parse_domain || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('adn.email.inbound.webhookSecret', 'Webhook Secret')}</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={inboundConfig?.sendgrid_webhook_secret || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inbound_active"
                    checked={inboundConfig?.is_active ?? false}
                    onCheckedChange={(checked) => saveInboundConfig({ is_active: checked })}
                  />
                  <Label htmlFor="inbound_active">
                    {t('adn.email.inbound.enableInbound', 'Activar recepción de emails')}
                  </Label>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t('adn.email.inbound.retention', 'Retención')}: {inboundConfig?.retention_days || 90} {t('adn.email.inbound.days', 'días')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Processing Features */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('adn.email.inbound.aiFeatures', 'Funciones de IA')}
              </CardTitle>
              <CardDescription>
                {t('adn.email.inbound.aiFeaturesDescription', 'Capacidades de procesamiento automático por agentes')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{t('adn.email.inbound.features.billing', 'Control Financiero')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('adn.email.inbound.features.billingDesc', 'Extracción automática de datos de facturas, recibos y estados de cuenta')}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 mb-2">
                    <HeadphonesIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">{t('adn.email.inbound.features.support', 'Soporte Inteligente')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('adn.email.inbound.features.supportDesc', 'Categorización y respuestas automáticas a consultas de clientes')}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{t('adn.email.inbound.features.notifications', 'Gestión de Alertas')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('adn.email.inbound.features.notificationsDesc', 'Filtrado y priorización de notificaciones importantes')}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Megaphone className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">{t('adn.email.inbound.features.marketing', 'Análisis de Campañas')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('adn.email.inbound.features.marketingDesc', 'Seguimiento de respuestas y métricas de campañas de email')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function
function getPurposeDescription(mailboxType: string): string {
  const descriptions: Record<string, string> = {
    billing: 'Facturas, recibos, estados de cuenta para control financiero',
    notifications: 'Alertas del sistema, confirmaciones, actualizaciones',
    support: 'Consultas de clientes, tickets de soporte',
    marketing: 'Respuestas a campañas, suscripciones, leads',
    general: 'Comunicaciones generales de la empresa',
  };
  return descriptions[mailboxType] || '';
}
