# Sistema de Traducción de Contenido Dinámico

Este sistema permite traducir automáticamente contenido dinámico generado por IA o almacenado en la base de datos al idioma preferido del usuario.

## Arquitectura

### Backend: Edge Function `translate-content`
- **Ubicación**: `supabase/functions/translate-content/index.ts`
- **Modelo IA**: Google Gemini 2.5 Flash (vía Lovable AI Gateway)
- **Función**: Traduce texto usando IA generativa manteniendo formato, tono y contexto

### Frontend: Hook `useContentTranslation`
- **Ubicación**: `src/hooks/useContentTranslation.ts`
- **Características**:
  - Cache automático de traducciones
  - Manejo de errores (rate limits, cuotas)
  - Soporte para textos individuales o arrays
  - Detección automática del idioma del usuario

### Componentes Reutilizables
- **`TranslatedContent`**: Componente básico para traducir cualquier contenido
- **`TranslatedInsightCard`**: Card de insight con traducción integrada

---

## Uso Básico

### 1. Hook `useContentTranslation`

```tsx
import { useContentTranslation } from '@/hooks/useContentTranslation';

function MyComponent() {
  const { translateContent, isTranslating, currentLanguage } = useContentTranslation();

  const handleTranslate = async () => {
    const translated = await translateContent(
      "Este es un insight de marketing",
      {
        sourceLanguage: 'es',
        contentType: 'insight',
        useCache: true // opcional, por defecto true
      }
    );
    
    console.log('Traducción:', translated);
  };

  return (
    <button onClick={handleTranslate} disabled={isTranslating}>
      Traducir
    </button>
  );
}
```

### 2. Componente `TranslatedContent`

```tsx
import { TranslatedContent } from '@/components/company/TranslatedContent';

// Texto simple
<TranslatedContent 
  content="Este es un insight de marketing" 
  sourceLanguage="es"
  contentType="insight"
/>

// Array de textos
<TranslatedContent 
  content={['Insight 1', 'Insight 2', 'Insight 3']} 
  sourceLanguage="es"
  contentType="insight"
/>

// Renderizado personalizado
<TranslatedContent 
  content="Marketing strategy"
  sourceLanguage="es"
  contentType="strategy"
  renderContent={(translated) => (
    <div className="custom-styling">
      <strong>{translated}</strong>
    </div>
  )}
/>
```

### 3. Componente `TranslatedInsightCard`

```tsx
import { TranslatedInsightCard } from '@/components/company/insights/TranslatedInsightCard';

<TranslatedInsightCard
  title="Título del Insight"
  content="Contenido del insight en español"
  type="audience"
  category="Tendencias"
  priority="alta"
  sourceLanguage="es"
/>
```

---

## Tipos de Contenido

El sistema soporta diferentes tipos de contenido con contexto específico:

- **`insight`**: Insights de marketing o análisis de audiencia
- **`strategy`**: Estrategias de marketing o planes de negocio
- **`post`**: Posts de redes sociales o contenido
- **`general`**: Contenido general de negocio o marketing

---

## Integración en Componentes Existentes

### Ejemplo 1: Traducir insights de audiencia

```tsx
import { useContentTranslation } from '@/hooks/useContentTranslation';
import { useEffect, useState } from 'react';

function AudienceInsights({ insights }) {
  const { translateContent, currentLanguage } = useContentTranslation();
  const [translatedInsights, setTranslatedInsights] = useState(insights);

  useEffect(() => {
    const translate = async () => {
      if (currentLanguage === 'es') {
        setTranslatedInsights(insights);
        return;
      }

      // Traducir títulos y contenidos
      const titles = insights.map(i => i.title);
      const contents = insights.map(i => i.content);

      const [translatedTitles, translatedContents] = await Promise.all([
        translateContent(titles, { sourceLanguage: 'es', contentType: 'insight' }),
        translateContent(contents, { sourceLanguage: 'es', contentType: 'insight' })
      ]);

      if (translatedTitles && translatedContents) {
        setTranslatedInsights(insights.map((insight, i) => ({
          ...insight,
          title: translatedTitles[i],
          content: translatedContents[i]
        })));
      }
    };

    translate();
  }, [insights, currentLanguage]);

  return (
    <div>
      {translatedInsights.map(insight => (
        <div key={insight.id}>
          <h3>{insight.title}</h3>
          <p>{insight.content}</p>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 2: Usar componente TranslatedContent directamente

```tsx
function InsightRenderer({ insight }) {
  return (
    <Card>
      <CardHeader>
        <TranslatedContent
          content={insight.title}
          sourceLanguage="es"
          contentType="insight"
          renderContent={(translated) => (
            <CardTitle>{translated}</CardTitle>
          )}
        />
      </CardHeader>
      <CardContent>
        <TranslatedContent
          content={insight.content}
          sourceLanguage="es"
          contentType="insight"
        />
      </CardContent>
    </Card>
  );
}
```

---

## Manejo de Errores

El sistema maneja automáticamente:

- **429 (Rate Limit)**: Muestra toast indicando que se alcanzó el límite
- **402 (Cuota Excedida)**: Muestra toast indicando que se excedió la cuota
- **500 (Error del Servidor)**: Muestra toast de error genérico
- **Fallback**: Si `fallbackToOriginal={true}`, muestra el contenido original en caso de error

---

## Rendimiento y Cache

### Cache Automático
- Las traducciones se cachean automáticamente en memoria
- El cache persiste durante la sesión del usuario
- La clave de cache incluye: idioma origen, idioma destino, tipo de contenido, y primeros 50 caracteres

### Limpiar Cache
```tsx
const { clearCache } = useContentTranslation();

// Limpiar cache cuando sea necesario (ej: actualización de contenido)
useEffect(() => {
  clearCache();
}, [contentUpdated]);
```

---

## Mejores Prácticas

1. **Especificar siempre el idioma de origen**:
   ```tsx
   <TranslatedContent content={text} sourceLanguage="es" />
   ```

2. **Usar el tipo de contenido correcto** para mejores traducciones:
   ```tsx
   <TranslatedContent content={insight} contentType="insight" />
   ```

3. **Traducir en batch** cuando sea posible:
   ```tsx
   // ✅ BIEN: Una llamada para múltiples textos
   const translated = await translateContent(['texto1', 'texto2', 'texto3']);
   
   // ❌ EVITAR: Múltiples llamadas individuales
   for (const text of texts) {
     await translateContent(text);
   }
   ```

4. **Habilitar fallback** para mejor UX:
   ```tsx
   <TranslatedContent content={text} fallbackToOriginal={true} />
   ```

---

## Limitaciones

- **Límite de tokens**: Máximo 4000 tokens por traducción
- **Rate limits**: Sujeto a los límites de Lovable AI
- **No persistente**: Las traducciones no se guardan en la base de datos (solo en cache de sesión)
- **Idiomas soportados**: Español (es), Inglés (en), Portugués (pt)

---

## Próximos Pasos (Opción B)

Para implementar almacenamiento persistente de traducciones:

1. Añadir columna `translations` JSONB a tablas relevantes:
```sql
ALTER TABLE content_insights 
ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
```

2. Estructura de almacenamiento:
```json
{
  "en": {
    "title": "Translated title",
    "content": "Translated content"
  },
  "pt": {
    "title": "Título traduzido",
    "content": "Conteúdo traduzido"
  }
}
```

3. Generar traducciones al crear contenido en lugar de on-demand
