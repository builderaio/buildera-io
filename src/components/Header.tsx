import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "./LanguageSelector";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const { t } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navLinks = [
    { href: "#valores", label: t('header.whyBuildera') },
    { href: "#ecosistema", label: t('header.ecosystem') },
    { href: "#casos-de-uso", label: t('header.cases') },
    { href: "/pricing", label: t('header.pricing', 'Pricing') },
    { href: "#contacto", label: t('header.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between" aria-label="Principal">
        <a href="/" className="flex items-center gap-2" aria-label="Inicio Buildera">
          <img src="/lovable-uploads/df793eae-f9ea-4291-9de2-ecf01e5005d5.png" alt="Buildera logo" className="h-8 w-auto" />
          <span className="sr-only">Buildera</span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a className="text-foreground/80 hover:text-foreground transition-smooth" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <a href="/auth?mode=login" className="hidden md:inline text-sm text-foreground/80 hover:text-foreground transition-smooth">
            {t('header.login')}
          </a>
          <a href="/auth?mode=signup&userType=company" className="hidden md:inline">
            <Button size="sm" className="shadow-glow">{t('header.getStarted')}</Button>
          </a>
          
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t space-y-2">
              <a href="/auth?mode=login" className="block py-2 text-sm text-foreground/80 hover:text-foreground">
                {t('header.login')}
              </a>
              <a href="/auth?mode=signup&userType=company" className="block">
                <Button size="sm" className="w-full shadow-glow">{t('header.getStarted')}</Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
