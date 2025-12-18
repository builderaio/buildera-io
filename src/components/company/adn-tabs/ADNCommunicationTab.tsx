import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommunicationSettings } from '@/hooks/useCommunicationSettings';
import { MessageSquare, Hash, Ban, Sparkles, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface ADNCommunicationTabProps {
  companyId: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Profesional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Amigable' },
  { value: 'fun', label: 'Divertido' },
  { value: 'conversational', label: 'Conversacional' },
  { value: 'formal', label: 'Formal' },
  { value: 'inspirational', label: 'Inspiracional' },
];

const EMOJI_OPTIONS = [
  { value: 'none', label: 'Sin emojis' },
  { value: 'minimal', label: 'Mínimo' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'frequent', label: 'Frecuente' },
];

const FORMALITY_OPTIONS = [
  { value: 'formal', label: 'Formal (Usted)' },
  { value: 'semi-formal', label: 'Semi-formal' },
  { value: 'informal', label: 'Informal (Tú)' },
];

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter'];

export const ADNCommunicationTab = ({ companyId }: ADNCommunicationTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, loading, saving, saveSettings } = useCommunicationSettings(companyId);

  const [localSettings, setLocalSettings] = useState({
    forbidden_words: [] as string[],
    approved_slogans: [] as string[],
    hashtag_strategy: { always_use: [] as string[], never_use: [] as string[], campaign_specific: [] as string[] },
    tone_by_platform: {} as Record<string, string>,
    emoji_usage: 'moderate',
    language_formality: 'semi-formal',
    call_to_action_phrases: [] as string[],
    content_pillars: [] as string[],
    topics_to_avoid: [] as string[],
  });

  const [newWord, setNewWord] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [newSlogan, setNewSlogan] = useState('');
  const [newPillar, setNewPillar] = useState('');

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        forbidden_words: settings.forbidden_words || [],
        approved_slogans: settings.approved_slogans || [],
        hashtag_strategy: settings.hashtag_strategy || { always_use: [], never_use: [], campaign_specific: [] },
        tone_by_platform: settings.tone_by_platform || {},
        emoji_usage: settings.emoji_usage || 'moderate',
        language_formality: settings.language_formality || 'semi-formal',
        call_to_action_phrases: settings.call_to_action_phrases || [],
        content_pillars: settings.content_pillars || [],
        topics_to_avoid: settings.topics_to_avoid || [],
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings(localSettings);
      toast({ title: t('company.email.saved') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const addToArray = (field: 'forbidden_words' | 'content_pillars' | 'approved_slogans', value: string) => {
    if (!value.trim()) return;
    setLocalSettings(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
  };

  const removeFromArray = (field: 'forbidden_words' | 'content_pillars' | 'approved_slogans', index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const addHashtag = (type: 'always_use' | 'never_use') => {
    if (!newHashtag.trim()) return;
    const tag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
    setLocalSettings(prev => ({
      ...prev,
      hashtag_strategy: {
        ...prev.hashtag_strategy,
        [type]: [...prev.hashtag_strategy[type], tag.trim()]
      }
    }));
    setNewHashtag('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('company.communication.tone_title', 'Tono de Comunicación')}
          </CardTitle>
          <CardDescription>
            {t('company.communication.tone_desc', 'Configura el tono por plataforma')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('company.communication.emoji_usage', 'Uso de emojis')}</Label>
              <Select 
                value={localSettings.emoji_usage} 
                onValueChange={(v) => setLocalSettings(prev => ({ ...prev, emoji_usage: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOJI_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('company.communication.formality', 'Formalidad')}</Label>
              <Select 
                value={localSettings.language_formality} 
                onValueChange={(v) => setLocalSettings(prev => ({ ...prev, language_formality: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMALITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Label>{t('company.communication.tone_by_platform', 'Tono por plataforma')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PLATFORMS.map(platform => (
                <div key={platform} className="space-y-1">
                  <Label className="text-xs capitalize">{platform}</Label>
                  <Select 
                    value={localSettings.tone_by_platform[platform] || 'casual'} 
                    onValueChange={(v) => setLocalSettings(prev => ({ 
                      ...prev, 
                      tone_by_platform: { ...prev.tone_by_platform, [platform]: v } 
                    }))}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {t('company.communication.hashtag_title', 'Estrategia de Hashtags')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('company.communication.always_use', 'Siempre usar')}</Label>
            <div className="flex gap-2">
              <Input
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                placeholder="#tuhashtag"
                onKeyDown={(e) => e.key === 'Enter' && addHashtag('always_use')}
              />
              <Button variant="outline" onClick={() => addHashtag('always_use')}>+</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSettings.hashtag_strategy.always_use.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    hashtag_strategy: {
                      ...prev.hashtag_strategy,
                      always_use: prev.hashtag_strategy.always_use.filter((_, idx) => idx !== i)
                    }
                  }))} />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            {t('company.communication.forbidden_title', 'Palabras Prohibidas')}
          </CardTitle>
          <CardDescription>
            {t('company.communication.forbidden_desc', 'Los agentes evitarán usar estas palabras')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder={t('company.communication.add_word', 'Agregar palabra')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addToArray('forbidden_words', newWord);
                  setNewWord('');
                }
              }}
            />
            <Button variant="outline" onClick={() => { addToArray('forbidden_words', newWord); setNewWord(''); }}>+</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localSettings.forbidden_words.map((word, i) => (
              <Badge key={i} variant="destructive" className="gap-1">
                {word}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('forbidden_words', i)} />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('company.communication.pillars_title', 'Pilares de Contenido')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
              placeholder={t('company.communication.add_pillar', 'Ej: Educación, Entretenimiento')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addToArray('content_pillars', newPillar);
                  setNewPillar('');
                }
              }}
            />
            <Button variant="outline" onClick={() => { addToArray('content_pillars', newPillar); setNewPillar(''); }}>+</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localSettings.content_pillars.map((pillar, i) => (
              <Badge key={i} variant="outline" className="gap-1">
                {pillar}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('content_pillars', i)} />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {t('company.email.save', 'Guardar Configuración')}
      </Button>
    </div>
  );
};
