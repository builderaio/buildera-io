import { useTranslation } from "react-i18next";
import { Instagram, Linkedin, Facebook } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation('landing');
  return (
    <footer className="bg-card border-t py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <h4 className="font-heading text-lg text-primary mb-4">{t('footer.brand.name')}</h4>
            <p className="text-muted-foreground text-sm">{t('footer.brand.tagline')}</p>
            <p className="text-muted-foreground text-sm mt-2">
              {t('footer.brand.copyright')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.solution.title')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#solucion" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.solution.platform')}
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.solution.ecosystem')}
                </a>
              </li>
              <li>
                <a href="#casos-de-uso" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.solution.useCases')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.company.title')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.company.about')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.company.contact')}
                </a>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.company.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-smooth">
                  {t('footer.company.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-muted-foreground hover:text-primary transition-smooth text-xs opacity-50 hover:opacity-100">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.connect.title')}</h4>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/builderaai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://www.linkedin.com/company/buildera-io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a 
                href="https://www.facebook.com/builderaai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="http://www.tiktok.com/@buildera_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                <FaTiktok className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;