import { COLORS } from '../theme/colors';

export const analyzeStationBehavior = (station: any) => {
  // 1. Regla de Precio (Determinista)
  if (station.price > station.officialPrice) {
    return {
      status: 'Infracción',
      color: COLORS.error,
      msg: 'Precio superior al oficial. Sanción requerida.'
    };
  }

  // 2. Machine Learning Simplificado (Z-Score para Stock)
  const history = station.history;
  const mean = history.reduce((a:number, b:number) => a + b, 0) / history.length;
  // Calculamos desviación estándar simulada si no hay suficientes datos
  const stdDev = mean * 0.2; 
  
  // Tomamos el último dato como "actual"
  const current = history[history.length - 1];
  const zScore = (current - mean) / (stdDev || 1);

  if (Math.abs(zScore) > 2) {
    return {
      status: 'Observación',
      color: COLORS.warning,
      msg: 'Comportamiento de venta atípico (Posible Contrabando).'
    };
  }

  return {
    status: 'Cumplimiento',
    color: COLORS.success,
    msg: 'Operación dentro de parámetros normales.'
  };
};