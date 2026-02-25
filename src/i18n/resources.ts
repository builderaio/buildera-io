// Bundled translations - imported at build time to avoid async loading race conditions
// ES
import esCommon from '../../public/locales/es/common.json';
import esCompany from '../../public/locales/es/company.json';
import esLanding from '../../public/locales/es/landing.json';
import esAuth from '../../public/locales/es/auth.json';
import esDashboard from '../../public/locales/es/dashboard.json';
import esMarketing from '../../public/locales/es/marketing.json';
import esAnalytics from '../../public/locales/es/analytics.json';
import esCampaigns from '../../public/locales/es/campaigns.json';
import esAdmin from '../../public/locales/es/admin.json';
import esErrors from '../../public/locales/es/errors.json';
import esValidation from '../../public/locales/es/validation.json';
import esNotifications from '../../public/locales/es/notifications.json';
import esCreatify from '../../public/locales/es/creatify.json';

// EN
import enCommon from '../../public/locales/en/common.json';
import enCompany from '../../public/locales/en/company.json';
import enLanding from '../../public/locales/en/landing.json';
import enAuth from '../../public/locales/en/auth.json';
import enDashboard from '../../public/locales/en/dashboard.json';
import enMarketing from '../../public/locales/en/marketing.json';
import enAnalytics from '../../public/locales/en/analytics.json';
import enCampaigns from '../../public/locales/en/campaigns.json';
import enAdmin from '../../public/locales/en/admin.json';
import enErrors from '../../public/locales/en/errors.json';
import enValidation from '../../public/locales/en/validation.json';
import enNotifications from '../../public/locales/en/notifications.json';
import enCreatify from '../../public/locales/en/creatify.json';

// PT
import ptCommon from '../../public/locales/pt/common.json';
import ptCompany from '../../public/locales/pt/company.json';
import ptLanding from '../../public/locales/pt/landing.json';
import ptAuth from '../../public/locales/pt/auth.json';
import ptDashboard from '../../public/locales/pt/dashboard.json';
import ptMarketing from '../../public/locales/pt/marketing.json';
import ptAnalytics from '../../public/locales/pt/analytics.json';
import ptCampaigns from '../../public/locales/pt/campaigns.json';
import ptAdmin from '../../public/locales/pt/admin.json';
import ptErrors from '../../public/locales/pt/errors.json';
import ptValidation from '../../public/locales/pt/validation.json';
import ptNotifications from '../../public/locales/pt/notifications.json';
import ptCreatify from '../../public/locales/pt/creatify.json';

export const resources = {
  es: {
    common: esCommon,
    company: esCompany,
    landing: esLanding,
    auth: esAuth,
    dashboard: esDashboard,
    marketing: esMarketing,
    analytics: esAnalytics,
    campaigns: esCampaigns,
    admin: esAdmin,
    errors: esErrors,
    validation: esValidation,
    notifications: esNotifications,
    creatify: esCreatify,
  },
  en: {
    common: enCommon,
    company: enCompany,
    landing: enLanding,
    auth: enAuth,
    dashboard: enDashboard,
    marketing: enMarketing,
    analytics: enAnalytics,
    campaigns: enCampaigns,
    admin: enAdmin,
    errors: enErrors,
    validation: enValidation,
    notifications: enNotifications,
    creatify: enCreatify,
  },
  pt: {
    common: ptCommon,
    company: ptCompany,
    landing: ptLanding,
    auth: ptAuth,
    dashboard: ptDashboard,
    marketing: ptMarketing,
    analytics: ptAnalytics,
    campaigns: ptCampaigns,
    admin: ptAdmin,
    errors: ptErrors,
    validation: ptValidation,
    notifications: ptNotifications,
    creatify: ptCreatify,
  },
};
