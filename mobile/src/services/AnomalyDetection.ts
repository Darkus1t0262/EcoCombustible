export const detectAnomalies = (history: number[], currentVal: number) => {
  if (!history || history.length === 0) {
    return { isAnomaly: false, status: 'No data', color: 'gray' };
  }

  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev === 0 ? 0 : (currentVal - mean) / stdDev;

  if (zScore > 2.5) return { isAnomaly: true, status: 'ALERT: High consumption', color: 'red' };
  if (zScore < -2.5) return { isAnomaly: true, status: 'ALERT: Low sales', color: 'orange' };

  return { isAnomaly: false, status: 'Normal', color: 'green' };
};
