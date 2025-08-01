import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Hook to ensure theme is properly initialized and persisted
 */
export const useThemeInitializer = () => {
  const { theme, systemTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    // Ensure the theme is applied to the document
    const applyTheme = () => {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    // Apply theme immediately
    applyTheme();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [theme, systemTheme, resolvedTheme]);
};