import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-business-growth.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Fondo con gradiente profesional */}
      <div className="absolute inset-0 hero-bg" />
      
      {/* Imagen de fondo sutil */}
      <div className="absolute inset-0 opacity-5">
        <img 
          src={heroImage} 
          alt="Transformación empresarial con IA" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Contenido principal centrado */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Mensaje principal estratégico */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Tecnología empresarial confiable</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold leading-tight tracking-tight">
              Automatiza tu negocio
              <span className="gradient-text block">
                simple, seguro y escalable
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Especialistas de IA que trabajan por ti: menos operación, más resultados. Tú te enfocas en crecer.
            </p>
          </div>

          {/* Credibilidad y números */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="text-3xl md:text-4xl font-bold text-secondary">500+</span>
              </div>
              <p className="text-sm text-muted-foreground">Empresas confiando</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-3xl md:text-4xl font-bold text-primary">90%</span>
              </div>
              <p className="text-sm text-muted-foreground">Reducción de costos</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-3xl md:text-4xl font-bold text-accent">24h</span>
              </div>
              <p className="text-sm text-muted-foreground">Implementación</p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth?mode=signup&userType=company">
              <Button 
                variant="hero"
                size="lg" 
                className="px-12 py-6 text-lg font-semibold group"
                aria-label="Comenzar con Buildera"
              >
                Comenzar ahora
                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            
            <a href="#casos-de-uso">
              <Button 
                variant="outline-hero" 
                size="lg"
                className="px-12 py-6 text-lg font-semibold"
                aria-label="Explorar casos de uso"
              >
                Ver casos de uso
              </Button>
            </a>
          </div>

          {/* Confianza empresarial */}
          <div className="pt-8 border-t border-border/20">
            <p className="text-sm text-muted-foreground mb-4">
              Más de 500 empresas ya han automatizado sus procesos con Buildera
            </p>
            <div className="flex justify-center items-center gap-2">
              <div className="flex -space-x-1">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary border border-background"></div>
                ))}
              </div>
              <span className="ml-3 text-sm font-medium text-foreground">Líderes en automatización empresarial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de scroll minimalista */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border border-primary/20 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;