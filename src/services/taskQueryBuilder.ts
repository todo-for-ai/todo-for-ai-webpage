export interface TaskFilterParams {
  projectId: number
  status?: string[]
  priority?: string
  search?: string
  sort_by?: string
  sort_order?: 'desc' | 'asc'
  page?: number
  pageSize?: number
}

export const buildTaskQuery = (params: TaskFilterParams) => {
  const query: any = {
    project_id: params.projectId,
    page: params.page || 1,
    page_size: params.pageSize || 20
  }

  if (params.status && params.status.length > 0) {
    query.status = params.status.join(',')
  }
  if (params.priority) {
    query.priority = params.priority
  }
  if (params.search) {
    query.search = params.search
  }
  if (params.sort_by) {
    query.sort_by = params.sort_by
  }
  if (params.sort_order) {
    query.sort_order = params.sort_order
  }

  return query
}
