// Theme initialization script for preventing theme flash
const themeScript = `
(function() {
  function setTheme() {
    try {
      var theme = localStorage.getItem('theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (theme === 'dark' || (theme === 'system' && prefersDark) || (!theme && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {
      console.warn('Error setting theme:', e);
    }
  }
  
  setTheme();
  
  // Listen for storage changes (when theme is changed in another tab)
  window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
      setTheme();
    }
  });
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
      setTheme();
    }
  });
})();
`;

export { themeScript };