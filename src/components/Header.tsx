import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "./LanguageSelector";

const Header = () => {
  const { t } = useTranslation('common');

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between" aria-label="Principal">
        <a href="/" className="flex items-center gap-2" aria-label="Inicio Buildera">
          <img src="/lovable-uploads/df793eae-f9ea-4291-9de2-ecf01e5005d5.png" alt="Buildera logo" className="h-8 w-auto" />
          <span className="sr-only">Buildera</span>
        </a>

        <ul className="hidden md:flex items-center gap-6 text-sm">
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#valores">{t('header.whyBuildera')}</a></li>
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#ecosistema">{t('header.ecosystem')}</a></li>
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#casos-de-uso">{t('header.cases')}</a></li>
          <li><a className="text-foreground/80 hover:text-foreground transition-smooth" href="#contacto">{t('header.contact')}</a></li>
        </ul>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <a href="/auth?mode=login" className="text-sm text-foreground/80 hover:text-foreground transition-smooth">{t('header.login')}</a>
          <a href="/auth?mode=signup&userType=company">
            <Button size="sm" className="shadow-glow">{t('header.getStarted')}</Button>
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;
