import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CompleteProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Developer fields
  const [githubUrl, setGithubUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // Expert fields
  const [industry, setIndustry] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industrySector, setIndustrySector] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const industries = [
    "Tecnología", "Finanzas", "Salud", "Educación", "Retail", 
    "Manufactura", "Consultoría", "Marketing", "Recursos Humanos", "Otro"
  ];

  const companySizes = [
    "1-10 empleados", "11-50 empleados", "51-200 empleados",
    "201-500 empleados", "501-1000 empleados", "1000+ empleados"
  ];

  const sectors = [
    "Tecnología", "Finanzas", "Salud", "Educación", "Retail",
    "Manufactura", "Servicios", "Construcción", "Agricultura", "Energía", "Otro"
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setFullName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");
      
      // Check if profile already exists and is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profile && profile.user_type) {
        // Profile exists and has user type, redirect based on type
        if (profile.user_type === 'company') {
          navigate('/company-dashboard');
        } else {
          navigate('/');
        }
        return;
      }

      // Check URL params for user type from OAuth
      const typeParam = searchParams.get('user_type');
      if (typeParam) {
        setUserType(typeParam);
      }

      // Check if this is a provider linking action
      const action = searchParams.get('action');
      if (action === 'link_provider') {
        // User is linking a new provider, update their profile
        await updateAuthProvider(session.user);
      }

      setInitializing(false);
    };

    const updateAuthProvider = async (user: any) => {
      try {
        // Get the app_metadata that contains the provider info
        const provider = user.app_metadata?.provider;
        if (provider && provider !== 'email') {
          // Add the new provider
          await supabase.rpc('add_linked_provider', {
            _user_id: user.id,
            _provider: provider
          });
        }
      } catch (error) {
        console.error('Error updating auth provider:', error);
      }
    };

    checkAuth();
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const profileData: any = {
        user_id: user.id,
        email: user.email || '',
        full_name: fullName,
        user_type: userType
      };

      // Add specific fields based on user type
      if (userType === 'developer') {
        profileData.github_url = githubUrl;
        profileData.skills = skills ? skills.split(',').map(s => s.trim()) : [];
        profileData.experience_years = experienceYears ? parseInt(experienceYears) : null;
      } else if (userType === 'expert') {
        profileData.industry = industry;
        profileData.expertise_areas = expertiseAreas ? expertiseAreas.split(',').map(s => s.trim()) : [];
        profileData.years_experience = yearsExperience ? parseInt(yearsExperience) : null;
      } else if (userType === 'company') {
        profileData.company_name = companyName;
        profileData.company_size = companySize;
        profileData.industry_sector = industrySector;
        profileData.website_url = websiteUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "¡Perfil completado!",
        description: "Su información ha sido guardada correctamente.",
      });

      // Redirect based on user type
      if (userType === 'company') {
        navigate('/company-dashboard');
      } else {
        navigate('/');
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading gradient-text">
            Completa tu perfil
          </h1>
          <p className="text-muted-foreground mt-2">
            Solo necesitamos algunos datos adicionales para personalizar tu experiencia
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle>Información adicional</CardTitle>
            <CardDescription>
              Ayúdanos a conocerte mejor seleccionando tu tipo de usuario y completando tu información
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userType">Tipo de usuario</Label>
                <Select value={userType} onValueChange={setUserType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">Desarrollador</SelectItem>
                    <SelectItem value="expert">Experto</SelectItem>
                    <SelectItem value="company">Negocio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {userType === 'developer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub URL (opcional)</Label>
                    <Input
                      id="githubUrl"
                      type="text"
                      placeholder="github.com/tuusuario"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Habilidades principales</Label>
                    <Input
                      id="skills"
                      type="text"
                      placeholder="React, Python, Node.js (separadas por comas)"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Años de experiencia</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      placeholder="5"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {userType === 'expert' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industria principal</Label>
                    <Select value={industry} onValueChange={setIndustry} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu industria" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expertiseAreas">Áreas de experiencia</Label>
                    <Input
                      id="expertiseAreas"
                      type="text"
                      placeholder="Estrategia digital, Transformación, IA (separadas por comas)"
                      value={expertiseAreas}
                      onChange={(e) => setExpertiseAreas(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Años de experiencia</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      placeholder="10"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {userType === 'company' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre del negocio</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Tu Negocio S.A.S."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Tamaño del negocio</Label>
                    <Select value={companySize} onValueChange={setCompanySize} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tamaño" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industrySector">Sector de la industria</Label>
                    <Select value={industrySector} onValueChange={setIndustrySector} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Sitio web</Label>
                    <Input
                      id="websiteUrl"
                      type="text"
                      placeholder="tunegocio.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading || !userType}>
                {loading ? "Guardando..." : "Completar perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;