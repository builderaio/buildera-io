import React from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/buildera-logo.png";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between" aria-label="Principal">
        <a href="/" className="flex items-center gap-2" aria-label="Inicio Buildera">
          <img src={logo} alt="Buildera logo" className="h-8 w-auto" />
          <span className="sr-only">Buildera</span>
        </a>

        <ul className="hidden md:flex items-center gap-6 text-sm">
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#pilares">Por qué Buildera</a></li>
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#arquitectura">Arquitectura</a></li>
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#contacto">Contacto</a></li>
        </ul>

        <div className="flex items-center gap-3">
          <a href="/auth?mode=login" className="text-sm text-foreground/80 hover:text-foreground transition-smooth">Iniciar sesión</a>
          <a href="/auth?mode=signup&userType=company">
            <Button size="sm" className="shadow-glow">Comenzar</Button>
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;
