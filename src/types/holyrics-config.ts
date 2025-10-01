export type ConnectionMode = 'local' | 'web';

export interface HolyricsConfig {
  mode: ConnectionMode;
  // Para API Local
  localHost?: string;
  localPort?: number;
  // Para ambos os modos
  token: string;
  // Apenas para API Server Web
  apiKey?: string;
}

export interface StoredConfig extends HolyricsConfig {
  lastUsed: string;
}

export const STORAGE_KEY = 'holyrics_config';

export const saveConfig = (config: HolyricsConfig): void => {
  const storedConfig: StoredConfig = {
    ...config,
    lastUsed: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConfig));
};

export const loadConfig = (): StoredConfig | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredConfig;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return null;
};

export const clearConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
