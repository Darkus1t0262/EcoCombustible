const toNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
};

export const analyzeStation = (station: {
  price: number;
  officialPrice: number;
  history: unknown;
  stock: number;
}) => {
  const history = toNumberArray(station.history);
  const priceDelta = station.price - station.officialPrice;

  if (priceDelta > 0.01) {
    return {
      status: 'Infracción',
      score: 90,
      message: 'Precio sobre el oficial reportado.',
      zScore: null,
    };
  }

  if (history.length < 3) {
    return {
      status: 'Observación',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo.',
      zScore: null,
    };
  }

  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const current = history[history.length - 1] ?? station.stock ?? 0;
  const zScore = stdDev === 0 ? 0 : (current - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observación',
      score: Math.max(score, 70),
      message: 'Variación atípica en consumo frente al promedio.',
      zScore,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
    message: 'Consumo dentro del rango esperado.',
    zScore,
  };
};

export const analyzeTransaction = (
  transaction: { liters: number; vehicle?: { capacityLiters: number } },
  history: number[]
) => {
  const capacity = transaction.vehicle?.capacityLiters ?? 0;
  if (capacity > 0 && transaction.liters > capacity * 1.05) {
    return {
      status: 'Infracción',
      score: 95,
      message: 'Consumo supera la capacidad declarada del vehículo.',
      zScore: null,
    };
  }

  if (history.length < 3) {
    return {
      status: 'Observación',
      score: 55,
      message: 'Historial insuficiente para evaluar consumo del vehículo.',
      zScore: null,
    };
  }

  const mean = history.reduce((acc, value) => acc + value, 0) / history.length;
  const variance = history.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev === 0 ? 0 : (transaction.liters - mean) / stdDev;
  const score = Math.min(100, Math.round(Math.abs(zScore) * 18));

  if (Math.abs(zScore) >= 2.5) {
    return {
      status: 'Observación',
      score: Math.max(score, 70),
      message: 'Consumo atípico respecto al historial del vehículo.',
      zScore,
    };
  }

  return {
    status: 'Cumplimiento',
    score: Math.max(score, 20),
      message: 'Consumo dentro del rango esperado para el vehículo.',
    zScore,
  };
};
