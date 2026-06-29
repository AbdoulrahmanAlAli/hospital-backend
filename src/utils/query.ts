import type { FilterQuery, Query } from 'mongoose';

export interface PaginationOptions {
  page?: string | number;
  limit?: string | number;
  sort?: string;
}

export const getPagination = (query: PaginationOptions) => {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
  const skip = (page - 1) * limit;
  const sort = query.sort ?? '-createdAt';
  return { page, limit, skip, sort };
};

export const buildSearchFilter = <T>(search: unknown, fields: string[]): FilterQuery<T> => {
  if (typeof search !== 'string' || !search.trim()) return {};
  const regex = new RegExp(search.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) } as FilterQuery<T>;
};

export const paginateQuery = async <T>(query: Query<T[], T>, totalQuery: Query<number, T>, options: PaginationOptions) => {
  const { page, limit, skip, sort } = getPagination(options);
  const [items, total] = await Promise.all([query.sort(sort).skip(skip).limit(limit), totalQuery]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
