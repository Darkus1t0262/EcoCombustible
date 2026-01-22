// Colores base y tokens para UI moderna
export type ThemeColors = {
  primary: string;
  accent: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  purple: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textLight: string;
  white: string;
  inputBg: string;
  borderColor: string;
};

export const LIGHT_COLORS: ThemeColors = {
  primary: '#1F5AA6',    // Azul institucional amigable
  accent: '#2FB7A5',     // Teal calmado
  secondary: '#28385E',  // Azul profundo
  success: '#2E9B72',    // Verde confiable
  warning: '#F2A65A',    // Naranja suave
  error: '#E05D5D',      // Rojo moderado
  purple: '#6F6CCB',     // Indigo sobrio
  background: '#F6F4F1', // Fondo calido
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F2',
  text: '#1B2430',
  textLight: '#6C7A89',
  white: '#FFFFFF',
  inputBg: '#FFFFFF',
  borderColor: '#E2E6EE',
};

export const DARK_COLORS: ThemeColors = {
  primary: '#4C8BF5',
  accent: '#3CD6C4',
  secondary: '#223A5E',
  success: '#35C48A',
  warning: '#F6B26B',
  error: '#F06B6B',
  purple: '#8C8EEB',
  background: '#0D1424',
  surface: '#111B2E',
  surfaceAlt: '#1C2740',
  text: '#F6F8FC',
  textLight: '#B8C2D8',
  white: '#FFFFFF',
  inputBg: '#0B1220',
  borderColor: '#25314A',
};

export const getThemeColors = (mode: 'light' | 'dark') => (mode === 'dark' ? DARK_COLORS : LIGHT_COLORS);

export const COLORS = LIGHT_COLORS;

// Datos mock para demo local
export const STATIONS_DB = [
  {
    id: 1,
    name: 'Estación Petroecuador Norte',
    address: 'Av. 6 de Diciembre, Quito',
    lat: -0.1807,
    lng: -78.4678,
    stock: 15000,
    price: 2.55,
    officialPrice: 2.55,
    history: [1200, 1150, 1220, 1180, 1210],
    lastAudit: '2025-11-28',
    status: 'Cumplimiento',
    mlStatus: 'Normal',
  },
  {
    id: 2,
    name: 'Gasolinera El Oro',
    address: 'Machala, Centro',
    lat: -3.2581,
    lng: -79.9551,
    stock: 45000,
    price: 2.58,
    officialPrice: 2.55,
    history: [300, 200, 4500, 100, 300], // Anomalía
    lastAudit: '2025-11-25',
    status: 'Observación',
    mlStatus: 'Anomalía detectada',
  },
  {
    id: 3,
    name: 'Estación Primax Centro',
    address: 'Guayaquil',
    lat: -2.1962,
    lng: -79.8862,
    stock: 2000,
    price: 2.55,
    officialPrice: 2.55,
    history: [0, 0, 0, 0, 0],
    lastAudit: '2025-11-30',
    status: 'Infracción',
    mlStatus: 'Crítico',
  },
];
