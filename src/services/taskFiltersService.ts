/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildTaskQuery } from './taskQueryBuilder'

export const toQueryParams = (filters: any, projectId: number, pagination: any) => {
  return buildTaskQuery({
    projectId,
    status: filters.status,
    priority: filters.priority,
    search: filters.search,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
    page: pagination.current,
    pageSize: pagination.pageSize
  })
}
