// Colores exactos extraídos de tus imágenes
export const COLORS = {
  primary: '#2F80ED',    // Azul Botones/Header
  secondary: '#0033A0',  // Azul Oscuro Gobierno
  success: '#27AE60',    // Verde Cumplimiento
  warning: '#F2C94C',    // Amarillo Observación
  error: '#EB5757',      // Rojo Infracción
  purple: '#9B51E0',     // Morado Auditorías/Reportes
  background: '#F2F2F2', // Fondo Gris
  text: '#333333',
  textLight: '#828282',
  white: '#FFFFFF',
  inputBg: '#FFFFFF',
  borderColor: '#E0E0E0'
};

// DATOS MOCK (Simulando tu Base de Datos SQLite para que la app funcione YA)
export const STATIONS_DB = [
  { 
    id: 1, name: "Estación Petroecuador Norte", address: "Av. 6 de Diciembre, Quito",
    lat: -0.1807, lng: -78.4678, 
    stock: 15000, price: 2.55, officialPrice: 2.55,
    history: [1200, 1150, 1220, 1180, 1210], 
    lastAudit: '2025-11-28', status: 'Cumplimiento', mlStatus: 'Normal'
  },
  { 
    id: 2, name: "Gasolinera El Oro", address: "Machala, Centro",
    lat: -3.2581, lng: -79.9551, 
    stock: 45000, price: 2.58, officialPrice: 2.55, 
    history: [300, 200, 4500, 100, 300], // Anomalía
    lastAudit: '2025-11-25', status: 'Observacion', mlStatus: 'Anomalía Detectada'
  },
  { 
    id: 3, name: "Estación Primax Centro", address: "Guayaquil",
    lat: -2.1962, lng: -79.8862, 
    stock: 2000, price: 2.55, officialPrice: 2.55,
    history: [0, 0, 0, 0, 0], 
    lastAudit: '2025-11-30', status: 'Infraccion', mlStatus: 'Crítico'
  },
];