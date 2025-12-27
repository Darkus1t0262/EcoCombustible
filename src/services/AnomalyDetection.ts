// Detecta anomalías usando Z-Score (Desviación Estándar)
export const detectAnomalies = (history: number[], currentVal: number) => {
  if (!history || history.length === 0) return { isAnomaly: false, status: 'Sin Datos', color: 'gray' };

  // 1. Calcular Media
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  
  // 2. Calcular Desviación Estándar
  const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);

  // 3. Calcular Z-Score (Qué tan lejos está el dato actual del promedio)
  // Evitamos división por cero si stdDev es 0
  const zScore = stdDev === 0 ? 0 : (currentVal - mean) / stdDev;

  // REGLAS DE NEGOCIO (ML)
  if (zScore > 2.5) return { isAnomaly: true, status: '🔴 ALERTA: Consumo Excesivo', color: 'red' };
  if (zScore < -2.5) return { isAnomaly: true, status: '🟠 ALERTA: Venta Anormal Baja', color: 'orange' };
  
  return { isAnomaly: false, status: '🟢 Operación Normal', color: 'green' };
};