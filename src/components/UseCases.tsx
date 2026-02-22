import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Megaphone, 
  HandshakeIcon, 
  Wallet, 
  Scale, 
  Users, 
  Settings2 
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  socialMedia: Megaphone,
  customerService: HandshakeIcon,
  sales: Wallet,
  ecommerce: Scale,
  professionalServices: Users,
  education: Settings2,
};

const colorMap: Record<string, string> = {
  primary: "border-primary/30 bg-primary/5 text-primary",
  secondary: "border-secondary/30 bg-secondary/5 text-secondary",
  accent: "border-accent/30 bg-accent/5 text-accent",
};

const useCases = [
  { id: "socialMedia", color: "primary" },
  { id: "customerService", color: "secondary" },
  { id: "sales", color: "accent" },
  { id: "ecommerce", color: "primary" },
  { id: "professionalServices", color: "secondary" },
  { id: "education", color: "accent" },
];

const UseCases = () => {
  const { t } = useTranslation("landing");

  return (
    <section id="casos-de-uso" className="py-16 scroll-mt-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
            {t("useCases.title")}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("useCases.subtitle")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {useCases.map((uc, i) => {
            const Icon = iconMap[uc.id];
            const colors = colorMap[uc.color];
            const features = t(`useCases.cases.${uc.id}.features`, { returnObjects: true }) as string[];

            return (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-6 transition-all hover:shadow-lg ${colors}`}
              >
                <Icon className="w-8 h-8 mb-4" />
                <h3 className="text-xl font-heading font-bold mb-2 text-foreground">
                  {t(`useCases.cases.${uc.id}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {t(`useCases.cases.${uc.id}.description`)}
                </p>
                <ul className="space-y-2">
                  {Array.isArray(features) && features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
