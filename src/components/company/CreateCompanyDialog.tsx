import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyManagement } from '@/hooks/useCompanyManagement';
import { useToast } from '@/hooks/use-toast';
import { Building } from 'lucide-react';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCompanyDialog = ({ open, onOpenChange }: CreateCompanyDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    industry_sector: '',
    company_size: ''
  });
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompanyManagement();
  const { toast } = useToast();

  const companySizes = [
    "1-10 empleados",
    "11-50 empleados", 
    "51-200 empleados",
    "201-500 empleados",
    "501-1000 empleados",
    "1000+ empleados"
  ];

  const sectors = [
    "Tecnología",
    "Finanzas",
    "Salud",
    "Educación",
    "Retail",
    "Manufactura",
    "Servicios",
    "Construcción",
    "Agricultura",
    "Energía",
    "Otro"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await createCompany(formData);
      
      if (result.success) {
        toast({
          title: "Empresa creada",
          description: "La empresa ha sido creada exitosamente",
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          website_url: '',
          industry_sector: '',
          company_size: ''
        });
        
        onOpenChange(false);
      } else {
        throw new Error(result.error?.message || 'Error desconocido');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Crear Nueva Empresa
          </DialogTitle>
          <DialogDescription>
            Agrega una nueva empresa a tu cuenta. Podrás invitar miembros posteriormente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">
              Nombre de la empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder="Mi Empresa S.A.S."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-description">Descripción</Label>
            <Textarea
              id="company-description"
              placeholder="Breve descripción de la empresa..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website">Sitio web</Label>
            <Input
              id="company-website"
              type="url"
              placeholder="https://miempresa.com"
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-sector">Sector</Label>
              <Select 
                value={formData.industry_sector} 
                onValueChange={(value) => handleInputChange('industry_sector', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sector" />
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
              <Label htmlFor="company-size">Tamaño</Label>
              <Select 
                value={formData.company_size} 
                onValueChange={(value) => handleInputChange('company_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tamaño" />
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
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};