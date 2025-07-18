import { Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-heading text-lg text-primary mb-4">BUILDERA</h4>
            <p className="text-muted-foreground text-sm">Building the New Era.</p>
            <p className="text-muted-foreground text-sm mt-2">
              © 2025 Innoventum S.A.S. Todos los derechos reservados.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Solución</h4>
            <ul className="space-y-2">
              <li>
                <a href="#solucion" className="text-muted-foreground hover:text-primary transition-smooth">
                  Plataforma
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-muted-foreground hover:text-primary transition-smooth">
                  Ecosistema
                </a>
              </li>
              <li>
                <a href="#casos-de-uso" className="text-muted-foreground hover:text-primary transition-smooth">
                  Casos de Uso
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Compañía</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  Contacto
                </a>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-smooth">
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-smooth">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">Conectar</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;