import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketingDataPersistence } from '@/hooks/useMarketingDataPersistence';
import { Database, Eye, Calendar, Image, Video, FileText, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Campaign {
  id: string;
  company_name: string;
  business_objective: string;
  status: string;
  created_at: string;
  buyer_personas: any[];
  marketing_strategies: any[];
}

export default function MarketingDataPersistenceManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { getUserCampaigns } = useMarketingDataPersistence();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const data = await getUserCampaigns();
    setCampaigns(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Audience Defined': return 'bg-blue-500';
      case 'Strategy Created': return 'bg-green-500';
      case 'Calendar Created': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Database className="w-8 h-8" />
            Marketing Data Persistence
          </h2>
          <p className="text-muted-foreground">
            Sistema de persistencia de datos para campañas de marketing
          </p>
        </div>
        <Button onClick={loadCampaigns} variant="outline">
          <Database className="w-4 h-4 mr-2" />
          Recargar Datos
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay campañas guardadas</h3>
            <p className="text-muted-foreground">
              Las campañas creadas con el AI Orchestrator aparecerán aquí automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold">Campañas Guardadas ({campaigns.length})</h3>
            {campaigns.map((campaign) => (
              <Card 
                key={campaign.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCampaign?.id === campaign.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {campaign.company_name}
                    </h4>
                    <Badge 
                      className={`${getStatusColor(campaign.status)} text-white text-xs`}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {campaign.business_objective}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(campaign.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.buyer_personas?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {campaign.marketing_strategies?.[0]?.content_calendar_items?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Campaign Details */}
          <div className="lg:col-span-2">
            {selectedCampaign ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {selectedCampaign.company_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedCampaign.business_objective}
                  </p>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="personas">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="personas">
                        <Users className="w-4 h-4 mr-2" />
                        Personas
                      </TabsTrigger>
                      <TabsTrigger value="strategy">
                        <FileText className="w-4 h-4 mr-2" />
                        Estrategia
                      </TabsTrigger>
                      <TabsTrigger value="calendar">
                        <Calendar className="w-4 h-4 mr-2" />
                        Calendario
                      </TabsTrigger>
                      <TabsTrigger value="assets">
                        <Image className="w-4 h-4 mr-2" />
                        Assets
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personas" className="space-y-4">
                      {selectedCampaign.buyer_personas?.map((persona, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">{persona.fictional_name}</h4>
                            {persona.professional_role && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {persona.professional_role}
                              </p>
                            )}
                            <div className="space-y-2">
                              {persona.details?.puntos_de_dolor && (
                                <div>
                                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                    Puntos de Dolor:
                                  </h5>
                                  <p className="text-sm">
                                    {Array.isArray(persona.details.puntos_de_dolor) 
                                      ? persona.details.puntos_de_dolor.join(', ')
                                      : persona.details.puntos_de_dolor
                                    }
                                  </p>
                                </div>
                              )}
                              {persona.details?.plataformas_prioritarias && (
                                <div>
                                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                    Plataformas:
                                  </h5>
                                  <div className="flex gap-1">
                                    {persona.details.plataformas_prioritarias.map((platform: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {platform}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="strategy" className="space-y-4">
                      {selectedCampaign.marketing_strategies?.map((strategy, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 space-y-4">
                            {strategy.unified_message && (
                              <div>
                                <h4 className="font-medium mb-2">Mensaje Unificado</h4>
                                <p className="text-sm">{strategy.unified_message}</p>
                              </div>
                            )}
                            
                            {strategy.competitive_analysis?.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Análisis Competitivo</h4>
                                <div className="space-y-2">
                                  {strategy.competitive_analysis.map((competitor: any, i: number) => (
                                    <div key={i} className="bg-muted p-3 rounded-lg">
                                      <p className="text-sm font-medium">{competitor.nombre || competitor.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {competitor.fortaleza || competitor.strength}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {strategy.content_plan && Object.keys(strategy.content_plan).length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Plan de Contenido</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                  <pre className="text-xs overflow-auto">
                                    {JSON.stringify(strategy.content_plan, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="calendar" className="space-y-4">
                      {selectedCampaign.marketing_strategies?.[0]?.content_calendar_items?.map((item: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Badge variant="outline" className="mb-2">
                                  {item.social_network}
                                </Badge>
                                <h4 className="font-medium">
                                  {item.content_details?.titulo_gancho || 
                                   item.content_details?.tema_concepto || 
                                   'Contenido programado'}
                                </h4>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <div>{item.publish_date}</div>
                                {item.publish_time && <div>{item.publish_time}</div>}
                              </div>
                            </div>
                            
                            {item.content_details && (
                              <div className="space-y-2">
                                {item.content_details.tipo_contenido && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.content_details.tipo_contenido}
                                  </Badge>
                                )}
                                {item.content_details.copy_mensaje && (
                                  <p className="text-sm">{item.content_details.copy_mensaje}</p>
                                )}
                                {item.final_copy && (
                                  <div className="bg-muted p-3 rounded-lg">
                                    <h5 className="text-xs font-medium mb-1">Copy Final:</h5>
                                    <p className="text-sm">{item.final_copy}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="assets" className="space-y-4">
                      {selectedCampaign.marketing_strategies?.[0]?.content_calendar_items
                        ?.filter((item: any) => item.generated_assets?.length > 0)
                        .map((item: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <h4 className="font-medium mb-3">
                                Assets para: {item.content_details?.tema_concepto || 'Post'}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.generated_assets.map((asset: any, i: number) => (
                                  <div key={i} className="bg-muted p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      {asset.asset_type === 'image' ? (
                                        <Image className="w-4 h-4" />
                                      ) : (
                                        <Video className="w-4 h-4" />
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {asset.asset_type}
                                      </Badge>
                                    </div>
                                    {asset.asset_url && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        URL: {asset.asset_url}
                                      </p>
                                    )}
                                    {asset.prompt_used && (
                                      <p className="text-xs">
                                        <span className="font-medium">Prompt:</span> {asset.prompt_used}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Selecciona una campaña</h3>
                  <p className="text-muted-foreground">
                    Haz clic en una campaña de la lista para ver sus detalles completos.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}