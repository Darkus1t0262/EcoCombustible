import { LIGHT_COLORS, ThemeColors } from '../theme/colors';

export type StationAnalysis = {
  status: string;
  score: number;
  message: string;
  zScore?: number | null;
  color?: string;
  msg?: string;
};

export const statusToColor = (status: string, colors: ThemeColors = LIGHT_COLORS) => {
  // Mapea estado textual a color de UI.
  const normalized = status.toLowerCase();
  if (normalized.includes('infrac')) {
    return colors.error;
  }
  if (normalized.includes('observa')) {
    return colors.warning;
  }
  return colors.success;
};

const toNumberArray = (value: unknown): number[] => {
  // Convierte historiales desconocidos a arreglo numerico seguro.
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
};

export const normalizeAnalysis = (
  analysis: Partial<StationAnalysis> | null | undefined,
  colors: ThemeColors = LIGHT_COLORS
) => {
  // Normaliza valores faltantes para mantener UI consistente.
  const status = analysis?.status ?? 'Observación';
  const message = analysis?.message ?? analysis?.msg ?? 'Sin detalle disponible.';
  const score = analysis?.score ?? 0;
  return {
    status,
    message,
    score,
    zScore: analysis?.zScore ?? null,
    color: analysis?.color ?? statusToColor(status, colors),
  } as StationAnalysis;
};

export const analyzeStationBehavior = (station: any, colors: ThemeColors = LIGHT_COLORS): StationAnalysis => {
  // Heuristica local usada cuando el backend no provee analisis.
  const priceDelta = Number(station.price ?? 0) - Number(station.officialPrice ?? 0);
  if (priceDelta > 0.01) {
    return {
      status: 'Infracción',
      score: 90,
      message: 'Precio sobre el oficial reportado.',
      color: colors.error,
    };
  }

  const history = toNumberArray(station.history);
  if (history.length < 3) {
    return {
      status: 'Observación',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo.',
      color: colors.warning,
    };
  }

  // Z-score para detectar variaciones atipicas en consumo.
  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const current = history[history.length - 1] ?? 0;
  const zScore = stdDev === 0 ? 0 : (current - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observación',
      score: Math.max(score, 70),
      message: 'Variación atípica en consumo frente al promedio.',
      zScore,
      color: colors.warning,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado.',
    zScore,
    color: colors.success,
  };
};
