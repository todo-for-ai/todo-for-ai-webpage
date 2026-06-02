import { useEffect } from 'react'
import { useTaskStore } from '../stores'
import { useTaskSelection } from '../components/ProjectDetail/hooks/useTaskSelection'
import { useTaskTableConfig } from '../components/ProjectDetail/hooks/useTaskTableConfig'

export const useProjectTasks = (projectId?: string) => {
  const {
    tasks,
    loading: tasksLoading,
    fetchTasks,
  } = useTaskStore()

  const { selectedTaskIds, handleTaskSelection, handleClearSelection } = useTaskSelection()
  const { getTaskColumns } = useTaskTableConfig()

  useEffect(() => {
    if (projectId) {
      void fetchTasks({ project_id: Number(projectId), per_page: 200, sort_by: 'created_at', sort_order: 'desc' })
    }
  }, [projectId, fetchTasks])

  return {
    tasks,
    tasksLoading,
    selectedTaskIds,
    handleTaskSelection,
    handleClearSelection,
    getTaskColumns
  }
}
