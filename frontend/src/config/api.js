const HOSTS = ['192.168.8.131', '10.0.2.2', 'localhost'];
const PORT = 5000;

let activeHost = HOSTS[0];

const normalizePath = (path) => (path.startsWith('/') ? path : `/${path}`);
const buildBaseUrl = (host) => `http://${host}:${PORT}`;
const buildUrl = (host, path) => `${buildBaseUrl(host)}${normalizePath(path)}`;

export const requestWithFallback = async (path, options = {}) => {
  const orderedHosts = [activeHost, ...HOSTS.filter((host) => host !== activeHost)];
  let lastError = null;

  for (const host of orderedHosts) {
    try {
      const response = await fetch(buildUrl(host, path), options);
      activeHost = host;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network request failed');
};

export const getUploadUrl = (path) => {
  if (!path) return null;
  return `${buildBaseUrl(activeHost)}${normalizePath(path)}`;
};
