/**
 * API Base URL Resolver
 * Resolves to live Railway cloud backend when running inside a Chrome/Edge extension,
 * or relative URL when running in browser web app.
 */
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'moz-extension:') {
      const customUrl = localStorage.getItem('getproducts_api_url');
      if (customUrl) return customUrl.replace(/\/$/, '');
      return 'https://scrapercsv-up.railway.app';
    }
  }
  return '';
};

export const isExtensionEnvironment = () => {
  return typeof window !== 'undefined' && 
    (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'moz-extension:' || typeof chrome !== 'undefined' && Boolean(chrome?.runtime?.id));
};
