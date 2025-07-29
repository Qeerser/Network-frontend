
/**
 * Application configuration
 * This file handles loading from environment variables
 */

interface AppConfig {
  baseUrl: string;
  socketServerUrl: string;
  apiUrl: string;
  debug: boolean;
}

// Default configuration values
const defaultConfig: AppConfig = {
  baseUrl: "",
  socketServerUrl: "",
  apiUrl: "/api",
  debug: true,
};

/**
 * Loads configuration from environment variables if available
 */
export function getConfig(): AppConfig {
  // Start with default config
  const config = { ...defaultConfig };
  
  // Load from env vars if available
  if (import.meta.env.VITE_BASE_URL) {
    config.baseUrl = import.meta.env.VITE_BASE_URL;
  }
  
  if (import.meta.env.VITE_SOCKET_SERVER_URL) {
    config.socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
  }
  
  if (import.meta.env.VITE_API_URL) {
    config.apiUrl = import.meta.env.VITE_API_URL;
  }
  
  if (import.meta.env.VITE_DEBUG !== undefined) {
    config.debug = import.meta.env.VITE_DEBUG === 'true';
  }
  
  return config;
}
