import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Target, Palette, Users, Settings } from 'lucide-react';

interface Variable {
  path: string;
  label: string;
  category: string;
  type: 'string' | 'object' | 'array';
}

interface SandboxInputGeneratorProps {
  payloadTemplate: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  company: <Building2 className="h-4 w-4" />,
  strategy: <Target className="h-4 w-4" />,
  branding: <Palette className="h-4 w-4" />,
  audiences: <Users className="h-4 w-4" />,
  other: <Settings className="h-4 w-4" />
};

const CATEGORY_LABELS: Record<string, string> = {
  company: 'Empresa',
  strategy: 'Estrategia',
  branding: 'Branding',
  audiences: 'Audiencias',
  other: 'Otros'
};

const DEFAULT_VALUES: Record<string, string> = {
  'company.id': 'sandbox-company-001',
  'company.name': 'Mi Empresa de Prueba',
  'company.description': 'Empresa tecnológica especializada en soluciones innovadoras',
  'company.website_url': 'https://mi-empresa.com',
  'company.industry_sector': 'Tecnología',
  'company.country': 'España',
  'strategy.mision': 'Democratizar el acceso a tecnología de calidad',
  'strategy.vision': 'Ser líderes en innovación tecnológica',
  'strategy.propuesta_valor': 'Soluciones simples para problemas complejos',
  'strategy.tono_comunicacion': 'profesional pero cercano',
  'branding.primary_color': '#3c46b2',
  'branding.secondary_color': '#f15438',
  'branding.visual_identity': 'Moderno, limpio y profesional',
  'userId': 'sandbox-user-001',
  'companyId': 'sandbox-company-001',
  'language': 'es',
  'platform': 'linkedin'
};

export const extractVariables = (template: string): Variable[] => {
  if (!template) return [];
  
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: Variable[] = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = regex.exec(template)) !== null) {
    const path = match[1].trim();
    if (seen.has(path)) continue;
    seen.add(path);
    
    const parts = path.split('.');
    const category = parts.length > 1 ? parts[0] : 'other';
    const label = formatLabel(path);
    
    variables.push({
      path,
      label,
      category: ['company', 'strategy', 'branding', 'audiences'].includes(category) ? category : 'other',
      type: 'string'
    });
  }
  
  return variables;
};

const formatLabel = (path: string): string => {
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export const getDefaultValue = (path: string): string => {
  return DEFAULT_VALUES[path] || DEFAULT_VALUES[path.split('.').pop() || ''] || '';
};

export const SandboxInputGenerator: React.FC<SandboxInputGeneratorProps> = ({
  payloadTemplate,
  values,
  onChange
}) => {
  const variables = extractVariables(payloadTemplate);
  
  // Group by category
  const grouped = variables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, Variable[]>);
  
  const handleChange = (path: string, value: string) => {
    onChange({ ...values, [path]: value });
  };
  
  if (variables.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          No se encontraron variables en el payload template.
          <br />
          <span className="text-sm">Usa la sintaxis {'{{variable.path}}'} para definir campos de entrada.</span>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, vars]) => (
        <Card key={category}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {CATEGORY_ICONS[category]}
              {CATEGORY_LABELS[category] || category}
              <Badge variant="secondary" className="ml-auto">
                {vars.length} campo{vars.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {vars.map((variable) => (
              <div key={variable.path} className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  {variable.label}
                  <code className="text-[10px] bg-muted px-1 rounded">
                    {`{{${variable.path}}}`}
                  </code>
                </Label>
                {variable.path.includes('description') || 
                 variable.path.includes('mision') || 
                 variable.path.includes('vision') || 
                 variable.path.includes('propuesta') ? (
                  <Textarea
                    value={values[variable.path] ?? getDefaultValue(variable.path)}
                    onChange={(e) => handleChange(variable.path, e.target.value)}
                    placeholder={getDefaultValue(variable.path)}
                    className="min-h-[60px] text-sm"
                  />
                ) : (
                  <Input
                    value={values[variable.path] ?? getDefaultValue(variable.path)}
                    onChange={(e) => handleChange(variable.path, e.target.value)}
                    placeholder={getDefaultValue(variable.path)}
                    className="text-sm"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SandboxInputGenerator;
