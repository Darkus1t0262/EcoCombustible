import { COLORS } from '../theme/colors';

export const analyzeStationBehavior = (station: any) => {
  // Price rule (deterministic)
  if (station.price > station.officialPrice) {
    return {
      status: 'Infraccion',
      color: COLORS.error,
      msg: 'Price above official value. Action required.',
    };
  }

  // Simple ML (z-score for sales history)
  const history = Array.isArray(station.history) ? station.history : [];
  if (history.length === 0) {
    return {
      status: 'Observacion',
      color: COLORS.warning,
      msg: 'No history data available.',
    };
  }
  const mean = history.reduce((a: number, b: number) => a + b, 0) / history.length;
  const stdDev = mean * 0.2;

  // Use last value as "current"
  const current = history[history.length - 1];
  const zScore = (current - mean) / (stdDev || 1);

  if (Math.abs(zScore) > 2) {
    return {
      status: 'Observacion',
      color: COLORS.warning,
      msg: 'Atypical sales behavior detected.',
    };
  }

  return {
    status: 'Cumplimiento',
    color: COLORS.success,
    msg: 'Operation within expected range.',
  };
};
