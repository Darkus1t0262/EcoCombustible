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
  primary: '#2563EB',    // Azul principal
  accent: '#22D3EE',     // Acento cyan
  secondary: '#0B2E59',  // Azul institucional
  success: '#22C55E',    // Verde cumplimiento
  warning: '#FB923C',    // Naranja observacion
  error: '#EF4444',      // Rojo infraccion
  purple: '#8B5CF6',     // Morado auditorias/reportes
  background: '#F5F7FB', // Fondo claro
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  text: '#111827',
  textLight: '#6B7280',
  white: '#FFFFFF',
  inputBg: '#FFFFFF',
  borderColor: '#E6EAF2',
};

export const DARK_COLORS: ThemeColors = {
  primary: '#3B82F6',
  accent: '#2DD4BF',
  secondary: '#1E3A8A',
  success: '#22C55E',
  warning: '#FB923C',
  error: '#EF4444',
  purple: '#A78BFA',
  background: '#0F172A',
  surface: '#111827',
  surfaceAlt: '#1F2937',
  text: '#F9FAFB',
  textLight: '#CBD5F5',
  white: '#FFFFFF',
  inputBg: '#0B1220',
  borderColor: '#273449',
};

export const getThemeColors = (mode: 'light' | 'dark') => (mode === 'dark' ? DARK_COLORS : LIGHT_COLORS);

export const COLORS = LIGHT_COLORS;

// Datos mock para demo local
export const STATIONS_DB = [
  {
    id: 1,
    name: 'Estacion Petroecuador Norte',
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
    history: [300, 200, 4500, 100, 300], // Anomalia
    lastAudit: '2025-11-25',
    status: 'Observacion',
    mlStatus: 'Anomalia Detectada',
  },
  {
    id: 3,
    name: 'Estacion Primax Centro',
    address: 'Guayaquil',
    lat: -2.1962,
    lng: -79.8862,
    stock: 2000,
    price: 2.55,
    officialPrice: 2.55,
    history: [0, 0, 0, 0, 0],
    lastAudit: '2025-11-30',
    status: 'Infraccion',
    mlStatus: 'Critico',
  },
];
