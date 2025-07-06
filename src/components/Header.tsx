import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <a href="#" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/9bbad23a-3f28-47fd-bf57-1a43f0129bff.png" 
              alt="Buildera Logo" 
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#solucion" className="text-muted-foreground hover:text-primary transition-smooth">
            Solución
          </a>
          <a href="#ecosistema" className="text-muted-foreground hover:text-primary transition-smooth">
            Ecosistema
          </a>
          <a href="#casos-de-uso" className="text-muted-foreground hover:text-primary transition-smooth">
            Casos de Uso
          </a>
          <a href="/auth">
            <Button variant="cta" size="lg">
              Únete Ahora
            </Button>
          </a>
        </div>
        <div className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;