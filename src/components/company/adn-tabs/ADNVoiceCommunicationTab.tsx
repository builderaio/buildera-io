import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommunicationSettings } from '@/hooks/useCommunicationSettings';
import { MessageSquare, Hash, Ban, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ADNVoiceCommunicationTabProps {
  companyId: string;
  brandVoice?: {
    personalidad?: string;
    descripcion?: string;
    palabras_clave?: string[];
  };
}

const EMOJI_OPTIONS = [
  { value: 'none', label: 'Sin emojis' },
  { value: 'minimal', label: 'Mínimo' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'frequent', label: 'Frecuente' },
];

const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual (tú)' },
  { value: 'formal', label: 'Formal (usted)' },
  { value: 'mixed', label: 'Mixto' },
];

export const ADNVoiceCommunicationTab = ({ companyId, brandVoice }: ADNVoiceCommunicationTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, loading, saveSettings } = useCommunicationSettings(companyId);
  
  const [newHashtag, setNewHashtag] = useState('');
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [newPillar, setNewPillar] = useState('');

  const handleSaveField = async (field: string, value: any) => {
    try {
      await saveSettings({ [field]: value });
    } catch {
      toast({ title: t('common:error'), variant: 'destructive' });
    }
  };

  const addToArray = async (field: string, value: string) => {
    if (!value.trim()) return;
    const currentArray = (settings?.[field as keyof typeof settings] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      await handleSaveField(field, [...currentArray, value.trim()]);
    }
  };

  const removeFromArray = async (field: string, value: string) => {
    const currentArray = (settings?.[field as keyof typeof settings] as string[]) || [];
    await handleSaveField(field, currentArray.filter(item => item !== value));
  };

  const addHashtag = async () => {
    if (!newHashtag.trim()) return;
    const hashtag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
    const currentHashtags = settings?.hashtag_strategy?.always_use || [];
    if (!currentHashtags.includes(hashtag)) {
      await handleSaveField('hashtag_strategy', {
        ...settings?.hashtag_strategy,
        always_use: [...currentHashtags, hashtag]
      });
    }
    setNewHashtag('');
  };

  const removeHashtag = async (hashtag: string) => {
    const currentHashtags = settings?.hashtag_strategy?.always_use || [];
    await handleSaveField('hashtag_strategy', {
      ...settings?.hashtag_strategy,
      always_use: currentHashtags.filter(h => h !== hashtag)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Brand Voice Summary (if available) */}
      {brandVoice && (brandVoice.personalidad || brandVoice.descripcion) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t('company.voice.brand_voice', 'Voz de Marca')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            {brandVoice.personalidad && (
              <Badge variant="secondary" className="mr-2 mb-2">{brandVoice.personalidad}</Badge>
            )}
            {brandVoice.descripcion && (
              <p className="text-sm text-muted-foreground">{brandVoice.descripcion}</p>
            )}
            {brandVoice.palabras_clave && brandVoice.palabras_clave.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {brandVoice.palabras_clave.map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{keyword}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Communication Style */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('company.voice.style', 'Estilo de Comunicación')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('company.voice.emoji_usage', 'Uso de emojis')}</Label>
              <Select 
                value={settings?.emoji_usage || 'moderate'} 
                onValueChange={(v) => handleSaveField('emoji_usage', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMOJI_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('company.voice.formality', 'Formalidad')}</Label>
              <Select 
                value={settings?.language_formality || 'formal'} 
                onValueChange={(v) => handleSaveField('language_formality', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMALITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hashtags */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            {t('company.voice.hashtags', 'Hashtags de marca')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="flex gap-2 mb-3">
            <Input
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              placeholder="#mihashtag"
              className="h-8 text-xs flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
            />
            <Button size="sm" variant="outline" onClick={addHashtag} className="h-8 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(settings?.hashtag_strategy?.always_use || []).map((hashtag, i) => (
              <Badge key={i} variant="secondary" className="text-xs pr-1">
                {hashtag}
                <button onClick={() => removeHashtag(hashtag)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(!settings?.hashtag_strategy?.always_use || settings.hashtag_strategy.always_use.length === 0) && (
              <span className="text-xs text-muted-foreground">{t('company.voice.no_hashtags', 'Sin hashtags configurados')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forbidden Words */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ban className="h-4 w-4" />
            {t('company.voice.forbidden', 'Palabras prohibidas')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="flex gap-2 mb-3">
            <Input
              value={newForbiddenWord}
              onChange={(e) => setNewForbiddenWord(e.target.value)}
              placeholder={t('company.voice.add_forbidden', 'Agregar palabra...')}
              className="h-8 text-xs flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToArray('forbidden_words', newForbiddenWord);
                  setNewForbiddenWord('');
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={() => {
              addToArray('forbidden_words', newForbiddenWord);
              setNewForbiddenWord('');
            }} className="h-8 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(settings?.forbidden_words || []).map((word, i) => (
              <Badge key={i} variant="destructive" className="text-xs pr-1">
                {word}
                <button onClick={() => removeFromArray('forbidden_words', word)} className="ml-1 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(!settings?.forbidden_words || settings.forbidden_words.length === 0) && (
              <span className="text-xs text-muted-foreground">{t('company.voice.no_forbidden', 'Sin palabras prohibidas')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Pillars */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('company.voice.pillars', 'Pilares de contenido')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="flex gap-2 mb-3">
            <Input
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
              placeholder={t('company.voice.add_pillar', 'Ej: Educación, Entretenimiento...')}
              className="h-8 text-xs flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToArray('content_pillars', newPillar);
                  setNewPillar('');
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={() => {
              addToArray('content_pillars', newPillar);
              setNewPillar('');
            }} className="h-8 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(settings?.content_pillars || []).map((pillar, i) => (
              <Badge key={i} variant="outline" className="text-xs pr-1">
                {pillar}
                <button onClick={() => removeFromArray('content_pillars', pillar)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(!settings?.content_pillars || settings.content_pillars.length === 0) && (
              <span className="text-xs text-muted-foreground">{t('company.voice.no_pillars', 'Sin pilares definidos')}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
