/**
 * Agent API — shared helper functions.
 */
import type { ListResult, Pagination } from './types'

export const unwrapData = <T>(response: unknown): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

export const unwrapList = <T>(response: unknown): ListResult<T> => {
  const payload = unwrapData<Record<string, unknown>>(response)
  const items = (payload?.items || payload?.data || []) as T[]
  const pagination = (payload?.pagination as Pagination) || {
    page: 1,
    per_page: Array.isArray(items) ? items.length : 0,
    total: Array.isArray(items) ? items.length : 0,
    pages: 1,
    has_next: false,
    has_prev: false,
    next_num: null,
    prev_num: null,
  }

  return {
    items: Array.isArray(items) ? items : [],
    pagination,
  }
}

export const buildQuery = (params?: object): string => {
  const queryParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        queryParams.append(key, String(value))
      }
    })
  }

  const query = queryParams.toString()
  return query ? `?${query}` : ''
}
