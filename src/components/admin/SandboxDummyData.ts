// Dummy data for Agent Sandbox testing

export const DUMMY_COMPANY = {
  id: 'sandbox-company-001',
  name: 'TechStart Solutions',
  description: 'Startup tecnológica especializada en soluciones SaaS para PyMEs',
  website_url: 'https://techstart-solutions.com',
  industry_sector: 'Tecnología',
  company_size: '10-50',
  country: 'España',
  instagram_url: 'https://instagram.com/techstartsolutions',
  linkedin_url: 'https://linkedin.com/company/techstart-solutions',
  facebook_url: 'https://facebook.com/techstartsolutions',
  tiktok_url: null,
  twitter_url: 'https://twitter.com/techstart_sol',
  youtube_url: null,
  logo_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const DUMMY_STRATEGY = {
  id: 'sandbox-strategy-001',
  company_id: 'sandbox-company-001',
  mision: 'Democratizar el acceso a tecnología empresarial de calidad para pequeñas y medianas empresas en Latinoamérica',
  vision: 'Ser la plataforma líder en soluciones SaaS para PyMEs, impulsando la transformación digital de más de 100,000 empresas para 2030',
  propuesta_valor: 'Software empresarial accesible, intuitivo y escalable que reduce costos operativos en un 40% y aumenta la productividad del equipo',
  tono_comunicacion: 'profesional pero cercano',
  palabras_clave: ['SaaS', 'PyMEs', 'automatización', 'productividad', 'transformación digital'],
  objetivos_negocio: [
    'Aumentar la base de usuarios activos en un 50% este trimestre',
    'Reducir el churn rate al 5% mensual',
    'Lanzar 3 nuevas integraciones con herramientas populares'
  ]
};

export const DUMMY_AUDIENCES = [
  {
    id: 'sandbox-aud-001',
    name: 'Founders y CEOs de PyMEs',
    description: 'Emprendedores y líderes de pequeñas empresas (5-50 empleados) buscando eficiencia operativa',
    age_ranges: { '25-34': 35, '35-44': 45, '45-54': 20 },
    gender_split: { male: 65, female: 35 },
    geographic_locations: ['México', 'Colombia', 'Argentina', 'Chile', 'España'],
    interests: ['Tecnología', 'Emprendimiento', 'Productividad', 'Finanzas'],
    pain_points: ['Procesos manuales que consumen tiempo', 'Falta de visibilidad en métricas', 'Costos elevados de software enterprise'],
    goals: ['Automatizar operaciones repetitivas', 'Reducir costos operativos', 'Escalar el negocio de forma sostenible'],
    content_preferences: { 'Casos de éxito': 40, 'Tutoriales': 30, 'Tips rápidos': 20, 'Webinars': 10 }
  },
  {
    id: 'sandbox-aud-002',
    name: 'Gerentes de Operaciones',
    description: 'Profesionales responsables de optimizar procesos internos en empresas medianas',
    age_ranges: { '30-39': 40, '40-49': 45, '50-59': 15 },
    gender_split: { male: 55, female: 45 },
    geographic_locations: ['México', 'Brasil', 'Argentina', 'Perú'],
    interests: ['Gestión de proyectos', 'Lean Management', 'KPIs', 'Automatización'],
    pain_points: ['Silos de información entre departamentos', 'Reportes manuales', 'Falta de integraciones'],
    goals: ['Unificar datos en una sola plataforma', 'Generar reportes automáticos', 'Mejorar colaboración entre equipos']
  }
];

export const DUMMY_BRANDING = {
  id: 'sandbox-branding-001',
  company_id: 'sandbox-company-001',
  primary_color: '#3c46b2',
  secondary_color: '#f15438',
  complementary_color_1: '#10B981',
  complementary_color_2: '#F59E0B',
  visual_identity: 'Diseño moderno, limpio y profesional con énfasis en simplicidad y claridad. Uso de espacios blancos generosos, tipografía sans-serif contemporánea y iconografía minimalista.',
  brand_voice: {
    personalidad: 'Experto accesible',
    descripcion: 'Comunicamos con autoridad pero sin arrogancia, haciendo accesibles conceptos técnicos complejos',
    palabras_clave: ['Innovador', 'Confiable', 'Cercano', 'Eficiente']
  },
  color_justifications: {
    primary: 'Azul corporativo que transmite confianza y profesionalismo',
    secondary: 'Naranja energético para CTAs y elementos de acción',
    complementary_1: 'Verde para estados de éxito y crecimiento',
    complementary_2: 'Ámbar para alertas y highlights'
  }
};

export const DUMMY_SOCIAL_POSTS = [
  {
    platform: 'linkedin',
    content: '🚀 5 formas de automatizar tu PyME sin gastar una fortuna...',
    engagement: { likes: 234, comments: 45, shares: 12 },
    posted_at: '2024-01-15T10:00:00Z'
  },
  {
    platform: 'instagram',
    content: 'El secreto de las PyMEs que crecen 3x más rápido ✨',
    engagement: { likes: 567, comments: 89, shares: 34 },
    posted_at: '2024-01-14T15:30:00Z'
  }
];

export type DummyDataType = 'company' | 'strategy' | 'audiences' | 'branding';

export const getDummyDataByType = (type: DummyDataType) => {
  switch (type) {
    case 'company':
      return DUMMY_COMPANY;
    case 'strategy':
      return DUMMY_STRATEGY;
    case 'audiences':
      return DUMMY_AUDIENCES;
    case 'branding':
      return DUMMY_BRANDING;
    default:
      return {};
  }
};

export const getAllDummyData = () => ({
  company: DUMMY_COMPANY,
  strategy: DUMMY_STRATEGY,
  audiences: DUMMY_AUDIENCES,
  branding: DUMMY_BRANDING,
  social_posts: DUMMY_SOCIAL_POSTS
});
