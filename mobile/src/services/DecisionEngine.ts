import { COLORS } from '../theme/colors';

export type StationAnalysis = {
  status: 'Cumplimiento' | 'Observacion' | 'Infraccion';
  score: number;
  message: string;
  zScore?: number | null;
  color?: string;
  msg?: string;
};

export const statusToColor = (status: string) => {
  if (status === 'Infraccion') {
    return COLORS.error;
  }
  if (status === 'Observacion') {
    return COLORS.warning;
  }
  return COLORS.success;
};

const toNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
};

export const normalizeAnalysis = (analysis: Partial<StationAnalysis> | null | undefined) => {
  const status = analysis?.status ?? 'Observacion';
  const message = analysis?.message ?? analysis?.msg ?? 'Sin detalle disponible.';
  const score = analysis?.score ?? 0;
  return {
    status,
    message,
    score,
    zScore: analysis?.zScore ?? null,
    color: analysis?.color ?? statusToColor(status),
  } as StationAnalysis;
};

export const analyzeStationBehavior = (station: any): StationAnalysis => {
  const priceDelta = Number(station.price ?? 0) - Number(station.officialPrice ?? 0);
  if (priceDelta > 0.01) {
    return {
      status: 'Infraccion',
      score: 90,
      message: 'Precio sobre el oficial reportado.',
      color: COLORS.error,
    };
  }

  const history = toNumberArray(station.history);
  if (history.length < 3) {
    return {
      status: 'Observacion',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo.',
      color: COLORS.warning,
    };
  }

  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const current = history[history.length - 1] ?? 0;
  const zScore = stdDev === 0 ? 0 : (current - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observacion',
      score: Math.max(score, 70),
      message: 'Variacion atipica en consumo frente al promedio.',
      zScore,
      color: COLORS.warning,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado.',
    zScore,
    color: COLORS.success,
  };
};
