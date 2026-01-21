import { ML_API_URL, ML_ENABLED, ML_FALLBACK_LABEL, ML_TIMEOUT_MS } from '../config/env.js';

export type MlRiskLabel = 'low' | 'medium' | 'high' | 'unknown';

export type MlRiskResult = {
  score: number | null;
  label: MlRiskLabel;
  modelVersion: string | null;
};

type MlResponse = {
  risk_score?: number;
  risk_label?: string;
  model_version?: string;
};

const normalizeLabel = (value?: string | null): MlRiskLabel => {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'unknown') {
    return value;
  }
  return ML_FALLBACK_LABEL;
};

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

export const evaluateTransactionRisk = async (input: {
  liters: number;
  unitPrice: number;
  totalAmount: number;
  capacityLiters?: number | null;
}): Promise<MlRiskResult | null> => {
  if (!ML_ENABLED || !ML_API_URL) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
  try {
    const response = await fetch(`${normalizeUrl(ML_API_URL)}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        liters: input.liters,
        unit_price: input.unitPrice,
        total_amount: input.totalAmount,
        capacity_liters: input.capacityLiters ?? null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { score: null, label: ML_FALLBACK_LABEL, modelVersion: null };
    }

    const payload = (await response.json()) as MlResponse;
    const score = Number.isFinite(payload.risk_score) ? Math.min(1, Math.max(0, payload.risk_score as number)) : null;
    const label = normalizeLabel(payload.risk_label);
    const modelVersion = typeof payload.model_version === 'string' ? payload.model_version : null;
    return { score, label, modelVersion };
  } catch (error) {
    return { score: null, label: ML_FALLBACK_LABEL, modelVersion: null };
  } finally {
    clearTimeout(timeout);
  }
};
