import { useState, useCallback } from 'react'

interface TaskFilters {
  status: string[]
  priority: string
  search: string
  sort_by: string
  sort_order: 'desc' | 'asc'
}

const defaultFilters: TaskFilters = {
  status: ['todo', 'in_progress', 'review'],
  priority: '',
  search: '',
  sort_by: 'updated_at',
  sort_order: 'desc'
}

export const useTaskFiltersState = () => {
  const [taskFilters, setTaskFilters] = useState<TaskFilters>(defaultFilters)

  const handleFilterChange = useCallback((key: keyof TaskFilters, value: any) => {
    setTaskFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  return {
    taskFilters,
    handleFilterChange,
    setTaskFilters
  }
}
