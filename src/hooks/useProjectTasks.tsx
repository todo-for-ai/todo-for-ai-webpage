import { useTaskStore } from '../stores'
import { useTaskSelection } from '../components/ProjectDetail/hooks/useTaskSelection'
import { useTaskTableConfig } from '../components/ProjectDetail/hooks/useTaskTableConfig'

export const useProjectTasks = (projectId?: string) => {
  const {
    tasks,
    loading: tasksLoading,
    pagination,
    queryParams,
    fetchTasks,
    setQueryParams,
  } = useTaskStore()

  const { selectedTaskIds, handleTaskSelection, handleClearSelection } = useTaskSelection()
  const { getTaskColumns } = useTaskTableConfig()

  return {
    tasks,
    tasksLoading,
    selectedTaskIds,
    handleTaskSelection,
    handleClearSelection,
    getTaskColumns
  }
}
