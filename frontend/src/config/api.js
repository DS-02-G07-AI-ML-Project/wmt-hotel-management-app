const HOSTS = ['192.168.8.131', '10.0.2.2', 'localhost'];
const PORT = 5000;

const hostedBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

let activeBaseUrl = hostedBaseUrl || `http://${HOSTS[0]}:${PORT}`;

const normalizePath = (path) => (path.startsWith('/') ? path : `/${path}`);
const buildBaseUrl = (host) => `http://${host}:${PORT}`;
const buildUrl = (baseUrl, path) => `${baseUrl}${normalizePath(path)}`;
const localBaseUrls = HOSTS.map(buildBaseUrl);

const getCandidateBaseUrls = () => {
  const orderedLocal = [activeBaseUrl, ...localBaseUrls.filter((baseUrl) => baseUrl !== activeBaseUrl)];
  if (hostedBaseUrl) {
    return [hostedBaseUrl, ...orderedLocal.filter((baseUrl) => baseUrl !== hostedBaseUrl)];
  }
  return orderedLocal;
};

export const requestWithFallback = async (path, options = {}) => {
  const orderedBaseUrls = getCandidateBaseUrls();
  let lastError = null;

  for (const baseUrl of orderedBaseUrls) {
    try {
      const response = await fetch(buildUrl(baseUrl, path), options);
      activeBaseUrl = baseUrl;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network request failed');
};

export const getUploadUrl = (path) => {
  if (!path) return null;
  return `${activeBaseUrl}${normalizePath(path)}`;
};
