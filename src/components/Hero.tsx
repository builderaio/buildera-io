import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Brain, Layers } from "lucide-react";
import heroImage from "@/assets/hero-business-growth.jpg";

const Hero = () => {
  const { t } = useTranslation('landing');
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 hero-bg" />
      
      <div className="absolute inset-0 opacity-5">
        <img 
          src={heroImage} 
          alt="Transformación empresarial con IA" 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('hero.badge')}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold leading-tight tracking-tight">
              {t('hero.title')}
              <span className="gradient-text block">
                {t('hero.subtitle')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
          </div>

          {/* Proof points - concrete, not inflated */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-secondary" />
                <span className="text-3xl md:text-4xl font-bold text-secondary">6</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('hero.stats.departments')}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="text-3xl md:text-4xl font-bold text-primary">27+</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('hero.stats.agents')}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-3xl md:text-4xl font-bold text-accent">6</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-[140px]">{t('hero.stats.cycle')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth?mode=signup&userType=company">
              <Button 
                variant="hero"
                size="lg" 
                className="px-12 py-6 text-lg font-semibold group"
                aria-label={t('hero.cta.start')}
              >
                {t('hero.cta.start')}
                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            
            <a href="#como-funciona">
              <Button 
                variant="outline-hero" 
                size="lg"
                className="px-12 py-6 text-lg font-semibold"
                aria-label={t('hero.cta.useCases')}
              >
                {t('hero.cta.useCases')}
              </Button>
            </a>
          </div>

          <div className="pt-8 border-t border-border/20">
            <p className="text-sm text-muted-foreground mb-2">
              {t('hero.trust.message')}
            </p>
            <span className="text-sm font-medium text-foreground">{t('hero.trust.badge')}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border border-primary/20 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
