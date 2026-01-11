import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type Pagination = {
  page: number;
  limit: number;
  offset: number;
};

export const parsePagination = (query: unknown): Pagination | null => {
  const parsed = paginationSchema.safeParse(query ?? {});
  if (!parsed.success) {
    return null;
  }

  const page = parsed.data.page ?? (parsed.data.limit ? 1 : undefined);
  const limit = parsed.data.limit ?? (page ? 50 : undefined);

  if (!page || !limit) {
    return null;
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};
