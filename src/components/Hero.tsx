import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Zap, Users, DollarSign, BarChart3, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-business-growth.jpg";

const Hero = () => {
  const [currentStat, setCurrentStat] = useState(0);
  
  const stats = [
    { label: "Reducción de costos", value: "90%", icon: DollarSign },
    { label: "Aumento en productividad", value: "300%", icon: TrendingUp },
    { label: "Tiempo de implementación", value: "24h", icon: Zap },
    { label: "Empresas creciendo", value: "500+", icon: BarChart3 }
  ];

  const benefits = [
    "Automatización completa de procesos",
    "Especialistas virtuales 24/7",
    "Escalamiento sin límites",
    "ROI garantizado en 30 días"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Fondo dinámico con gradiente */}
      <div className="absolute inset-0 hero-bg" />
      
      {/* Imagen de fondo con overlay */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={heroImage} 
          alt="Crecimiento empresarial con tecnología" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Contenido principal */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Columna izquierda - Contenido */}
          <div className="space-y-8">
            {/* Badge de novedad */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-4 py-2 bg-secondary/10 text-secondary border-secondary/20">
                <Zap className="w-4 h-4 mr-2" />
                IA de Última Generación
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Gratis por tiempo limitado
              </Badge>
            </div>

            {/* Título principal */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight">
                Crece tu empresa
                <span className="gradient-text block">
                  sin aumentar costos
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                Automatiza procesos, reduce gastos hasta <strong className="text-secondary">90%</strong> y 
                escala con <strong className="text-primary">especialistas virtuales de IA</strong> que 
                trabajan 24/7 para hacer crecer tu negocio.
              </p>
            </div>

            {/* Lista de beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground/80">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Estadística dinámica */}
            <div className="growth-card p-6 max-w-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  {React.createElement(stats[currentStat].icon, { 
                    className: "w-6 h-6 text-primary" 
                  })}
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {stats[currentStat].value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats[currentStat].label}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/auth?mode=signup&userType=company">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-8 py-4 text-lg shadow-glow hover:shadow-elegant transition-spring group"
                >
                  Comenzar Gratis Ahora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              
              <a href="/pricing">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto px-8 py-4 text-lg border-2 hover:bg-primary/5 transition-spring"
                >
                  Ver Planes y ROI
                </Button>
              </a>
            </div>

            {/* Testimonio rápido */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/20">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full border-2 border-background"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-secondary to-primary rounded-full border-2 border-background"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full border-2 border-background"></div>
              </div>
              <div className="text-sm">
                <span className="font-semibold">500+ empresas</span>
                <span className="text-muted-foreground"> ya están creciendo con Buildera</span>
              </div>
            </div>
          </div>

          {/* Columna derecha - Visualización */}
          <div className="relative">
            {/* Card de demostración flotante */}
            <div className="growth-card p-8 max-w-md mx-auto space-y-6 bg-card/80 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Tu Centro de Control</h3>
                <p className="text-muted-foreground text-sm">Automatización empresarial en tiempo real</p>
              </div>
              
              {/* Métricas simuladas */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ventas automatizadas</span>
                  <span className="text-lg font-semibold text-secondary">+247%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Costos reducidos</span>
                  <span className="text-lg font-semibold text-primary">-89%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tiempo ahorrado</span>
                  <span className="text-lg font-semibold text-accent">35h/semana</span>
                </div>
              </div>
              
              {/* Indicadores de actividad */}
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>

            {/* Elementos decorativos flotantes */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-8 -left-4 w-16 h-16 bg-secondary/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;