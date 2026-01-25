import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Plus, Trash2, Sparkles, HelpCircle, Users, Globe, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayToWinStrategy, TargetMarket, TargetSegment, GeographicFocus, ChannelFocus } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface WhereToPlayStepProps {
  strategy: PlayToWinStrategy;
  companyId: string;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const channelOptions = [
  { id: 'social_media', label: 'Redes Sociales', icon: '📱' },
  { id: 'email', label: 'Email Marketing', icon: '📧' },
  { id: 'content', label: 'Marketing de Contenido', icon: '📝' },
  { id: 'paid_ads', label: 'Publicidad Pagada', icon: '💰' },
  { id: 'seo', label: 'SEO / Orgánico', icon: '🔍' },
  { id: 'partnerships', label: 'Alianzas / Partners', icon: '🤝' },
  { id: 'events', label: 'Eventos / Webinars', icon: '🎤' },
  { id: 'referrals', label: 'Referidos', icon: '👥' }
];

export default function WhereToPlayStep({ strategy, companyId, onUpdate, isSaving }: WhereToPlayStepProps) {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<TargetMarket[]>(strategy.targetMarkets || []);
  const [segments, setSegments] = useState<TargetSegment[]>(strategy.targetSegments || []);
  const [geographics, setGeographics] = useState<GeographicFocus[]>(strategy.geographicFocus || []);
  const [channels, setChannels] = useState<ChannelFocus[]>(strategy.channelsFocus || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      targetMarkets: markets,
      targetSegments: segments,
      geographicFocus: geographics,
      channelsFocus: channels
    });
    setHasChanges(false);
  }, [markets, segments, geographics, channels, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) saveChanges();
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  // Market handlers
  const addMarket = () => {
    setMarkets([...markets, {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      priority: 'medium',
      sizeEstimate: ''
    }]);
    setHasChanges(true);
  };

  const updateMarket = (id: string, field: keyof TargetMarket, value: any) => {
    setMarkets(markets.map(m => m.id === id ? { ...m, [field]: value } : m));
    setHasChanges(true);
  };

  const removeMarket = (id: string) => {
    setMarkets(markets.filter(m => m.id !== id));
    setHasChanges(true);
  };

  // Segment handlers
  const addSegment = () => {
    setSegments([...segments, {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      size: '',
      growthPotential: 'medium'
    }]);
    setHasChanges(true);
  };

  const updateSegment = (id: string, field: keyof TargetSegment, value: any) => {
    setSegments(segments.map(s => s.id === id ? { ...s, [field]: value } : s));
    setHasChanges(true);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
    setHasChanges(true);
  };

  // Geographic handlers
  const addGeographic = () => {
    setGeographics([...geographics, {
      id: crypto.randomUUID(),
      region: '',
      country: '',
      priority: 'primary'
    }]);
    setHasChanges(true);
  };

  const updateGeographic = (id: string, field: keyof GeographicFocus, value: any) => {
    setGeographics(geographics.map(g => g.id === id ? { ...g, [field]: value } : g));
    setHasChanges(true);
  };

  const removeGeographic = (id: string) => {
    setGeographics(geographics.filter(g => g.id !== id));
    setHasChanges(true);
  };

  // Channel handlers
  const toggleChannel = (channelId: string, channelLabel: string) => {
    const existing = channels.find(c => c.channel === channelId);
    if (existing) {
      setChannels(channels.filter(c => c.channel !== channelId));
    } else {
      setChannels([...channels, {
        id: crypto.randomUUID(),
        channel: channelId,
        priority: 'secondary',
        rationale: ''
      }]);
    }
    setHasChanges(true);
  };

  const updateChannel = (channelId: string, field: keyof ChannelFocus, value: any) => {
    setChannels(channels.map(c => c.channel === channelId ? { ...c, [field]: value } : c));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Map className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Paso 2: Where to Play</CardTitle>
              <CardDescription className="text-base mt-1">
                Decide dónde vas a competir: qué mercados, segmentos de clientes, 
                geografías y canales serán tu campo de batalla.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar con IA
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="markets" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="markets" className="gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Mercados</span>
          </TabsTrigger>
          <TabsTrigger value="segments" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Segmentos</span>
          </TabsTrigger>
          <TabsTrigger value="geography" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Geografía</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Canales</span>
          </TabsTrigger>
        </TabsList>

        {/* Markets Tab */}
        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Mercados Objetivo</CardTitle>
                  <CardDescription>
                    ¿En qué industrias o verticales vas a competir?
                  </CardDescription>
                </div>
                <Button onClick={addMarket} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Mercado
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {markets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no has definido mercados objetivo</p>
                  <Button onClick={addMarket} variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primer mercado
                  </Button>
                </div>
              ) : (
                markets.map((market) => (
                  <div key={market.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-5">
                        <Label className="text-xs">Nombre del Mercado</Label>
                        <Input
                          value={market.name}
                          onChange={(e) => updateMarket(market.id, 'name', e.target.value)}
                          placeholder="Ej: E-commerce B2B"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <Label className="text-xs">Prioridad</Label>
                        <Select
                          value={market.priority}
                          onValueChange={(v) => updateMarket(market.id, 'priority', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🔴 Alta</SelectItem>
                            <SelectItem value="medium">🟡 Media</SelectItem>
                            <SelectItem value="low">🟢 Baja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5 sm:col-span-3">
                        <Label className="text-xs">Tamaño Estimado</Label>
                        <Input
                          value={market.sizeEstimate}
                          onChange={(e) => updateMarket(market.id, 'sizeEstimate', e.target.value)}
                          placeholder="Ej: $500M"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMarket(market.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Textarea
                        value={market.description}
                        onChange={(e) => updateMarket(market.id, 'description', e.target.value)}
                        placeholder="Describe este mercado y por qué es relevante..."
                        className="mt-1 min-h-[60px]"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Segmentos de Cliente</CardTitle>
                  <CardDescription>
                    ¿Quiénes son tus clientes ideales?
                  </CardDescription>
                </div>
                <Button onClick={addSegment} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Segmento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {segments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no has definido segmentos de cliente</p>
                  <Button onClick={addSegment} variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primer segmento
                  </Button>
                </div>
              ) : (
                segments.map((segment) => (
                  <div key={segment.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-5">
                        <Label className="text-xs">Nombre del Segmento</Label>
                        <Input
                          value={segment.name}
                          onChange={(e) => updateSegment(segment.id, 'name', e.target.value)}
                          placeholder="Ej: PYMEs tecnológicas"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <Label className="text-xs">Potencial</Label>
                        <Select
                          value={segment.growthPotential}
                          onValueChange={(v) => updateSegment(segment.id, 'growthPotential', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🚀 Alto</SelectItem>
                            <SelectItem value="medium">📈 Medio</SelectItem>
                            <SelectItem value="low">📊 Bajo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5 sm:col-span-3">
                        <Label className="text-xs">Tamaño</Label>
                        <Input
                          value={segment.size}
                          onChange={(e) => updateSegment(segment.id, 'size', e.target.value)}
                          placeholder="Ej: 50,000"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSegment(segment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Textarea
                        value={segment.description}
                        onChange={(e) => updateSegment(segment.id, 'description', e.target.value)}
                        placeholder="Describe las características de este segmento..."
                        className="mt-1 min-h-[60px]"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Foco Geográfico</CardTitle>
                  <CardDescription>
                    ¿En qué regiones o países te vas a enfocar?
                  </CardDescription>
                </div>
                <Button onClick={addGeographic} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Región
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {geographics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aún no has definido tu foco geográfico</p>
                  <Button onClick={addGeographic} variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primera región
                  </Button>
                </div>
              ) : (
                geographics.map((geo) => (
                  <div key={geo.id} className="grid grid-cols-12 gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="col-span-5">
                      <Label className="text-xs">Región</Label>
                      <Input
                        value={geo.region}
                        onChange={(e) => updateGeographic(geo.id, 'region', e.target.value)}
                        placeholder="Ej: Latinoamérica"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">País</Label>
                      <Input
                        value={geo.country}
                        onChange={(e) => updateGeographic(geo.id, 'country', e.target.value)}
                        placeholder="Ej: México"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Prioridad</Label>
                      <Select
                        value={geo.priority}
                        onValueChange={(v) => updateGeographic(geo.id, 'priority', v as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primario</SelectItem>
                          <SelectItem value="secondary">Secundario</SelectItem>
                          <SelectItem value="exploratory">Exploratorio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGeographic(geo.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Canales Prioritarios</CardTitle>
              <CardDescription>
                ¿Qué canales usarás para llegar a tus clientes?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {channelOptions.map((channel) => {
                  const isSelected = channels.some(c => c.channel === channel.id);
                  const channelData = channels.find(c => c.channel === channel.id);
                  
                  return (
                    <div
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id, channel.label)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all text-center",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="text-2xl mb-2">{channel.icon}</div>
                      <div className="font-medium text-sm">{channel.label}</div>
                      {isSelected && (
                        <Select
                          value={channelData?.priority || 'secondary'}
                          onValueChange={(v) => updateChannel(channel.id, 'priority', v)}
                        >
                          <SelectTrigger className="mt-2 h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primario</SelectItem>
                            <SelectItem value="secondary">Secundario</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
