import { STATIONS_DB } from '../theme/colors';

// Estructura de datos que esperamos recibir de la App "Despachador"
export interface ExternalStationData {
  id: number;
  name: string;
  stock: number; // Viene del Despachador
  salesHistory: number[]; // Viene del Despachador
  registeredVehicles: number; // Viene de la App Cliente
}

export const StationService = {
  // Simula la petición a la API de los otros grupos
  getAllStations: async (): Promise<any[]> => {
    return new Promise((resolve) => {
      // Simulamos un retraso de red de 500ms
      setTimeout(() => {
        resolve(STATIONS_DB);
      }, 500);
    });
  },

  // Simula obtener detalles específicos de una estación
  getStationDetails: async (id: number) => {
    return new Promise((resolve) => {
      const station = STATIONS_DB.find(s => s.id === id);
      setTimeout(() => resolve(station), 300);
    });
  }
};