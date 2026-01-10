import { z } from 'zod';

export const optionalString = () =>
  z.preprocess(
    (value) =>
      value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
        ? undefined
        : value,
    z.string().min(1).optional()
  );

export const optionalNumber = () =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().optional()
  );

export const optionalDate = () =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.date().optional()
  );
