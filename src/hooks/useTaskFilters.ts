import { useTaskFiltersState } from './useTaskFiltersState'

export const useTaskFilters = () => {
  const { taskFilters, handleFilterChange, setTaskFilters } = useTaskFiltersState()
  return { taskFilters, handleFilterChange, setTaskFilters }
}
