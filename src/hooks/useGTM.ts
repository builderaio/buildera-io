import { useEffect } from 'react';

export const useGTM = () => {
  useEffect(() => {
    // Check if GTM is already loaded
    if (typeof window !== 'undefined' && !(window as any).gtag) {
      // Load GTM script if not already loaded
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GTM-WRPQHCM9';
      document.head.appendChild(script);

      // Initialize dataLayer and gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'GTM-WRPQHCM9');
    }
  }, []);
};