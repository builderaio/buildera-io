export const detectLanguageByGeolocation = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const countryCode = data.country_code?.toLowerCase();
    
    // Map country codes to supported languages
    const countryLanguageMap: { [key: string]: string } = {
      'es': 'es', // Spain
      'mx': 'es', // Mexico
      'ar': 'es', // Argentina
      'co': 'es', // Colombia
      'cl': 'es', // Chile
      'pe': 'es', // Peru
      've': 'es', // Venezuela
      'ec': 'es', // Ecuador
      'gt': 'es', // Guatemala
      'cu': 'es', // Cuba
      'bo': 'es', // Bolivia
      'do': 'es', // Dominican Republic
      'hn': 'es', // Honduras
      'py': 'es', // Paraguay
      'sv': 'es', // El Salvador
      'ni': 'es', // Nicaragua
      'cr': 'es', // Costa Rica
      'pa': 'es', // Panama
      'uy': 'es', // Uruguay
      'br': 'pt', // Brazil
      'pt': 'pt', // Portugal
      'ao': 'pt', // Angola
      'mz': 'pt', // Mozambique
    };
    
    return countryLanguageMap[countryCode] || 'en';
  } catch (error) {
    console.error('Error detecting language by geolocation:', error);
    return 'es'; // Default fallback
  }
};
