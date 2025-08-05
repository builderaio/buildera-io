import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

interface WaitlistFormProps {
  userType: "developer" | "expert";
  email: string;
  fullName: string;
}

const WaitlistForm = ({ userType, email, fullName }: WaitlistFormProps) => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular envío a lista de espera
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast({
        title: "¡Gracias por tu interés!",
        description: "Te contactaremos pronto con más información.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos procesar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-heading text-foreground">
              ¡Estás en la lista!
            </h2>
            <p className="text-muted-foreground">
              Te notificaremos cuando abramos el acceso para {userType === "developer" ? "desarrolladores" : "expertos"}.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader className="text-center">
        <CardTitle>Lista de Espera</CardTitle>
        <CardDescription>
          Buildera para {userType === "developer" ? "desarrolladores" : "expertos"} estará disponible pronto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waitlist-name">Nombre completo</Label>
            <Input
              id="waitlist-name"
              type="text"
              value={fullName}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="waitlist-email">Email</Label>
            <Input
              id="waitlist-email"
              type="email"
              value={email}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">¿Qué te interesa más de Buildera? (opcional)</Label>
            <textarea
              id="message"
              className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Cuéntanos qué esperas de la plataforma..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Unirme a la lista de espera"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WaitlistForm;