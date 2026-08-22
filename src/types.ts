export interface PhotoRecord {
  id: string;
  imageUrl: string;
  title: string;
  caption?: string;
  timestamp: number;
  dateFormatted: string;
  favorite: boolean;
  tag?: string;
  filter?: string;
  location?: string;
}

export interface AppSettings {
  storageType: 'indexeddb' | 'local';
  flashMode: 'auto' | 'on' | 'off';
  soundEffects: boolean;
  timerSeconds: 0 | 3 | 5 | 10;
  cameraFacing: 'user' | 'environment';
  aspectRatio: '1:1' | '4:3' | '16:9';
  gridOverlay: boolean;
  filterPreset: string;
  quality: 'standard' | 'high';
  autoSaveToDevice: boolean;
}

export type NavigationTab = 'home' | 'capture' | 'memories' | 'community' | 'chat' | 'settings' | 'tools';
