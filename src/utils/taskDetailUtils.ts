export interface TaskFilters {
  status: string
  priority: string
  search: string
  sort_by: string
  sort_order: 'desc' | 'asc'
}

export const loadTaskFiltersFromStorage = (): TaskFilters => {
  try {
    const saved = localStorage.getItem('project-task-filters')
    if (saved) {
      return { ...JSON.parse(saved) }
    }
  } catch (error) {
    console.warn('Failed to load task filters from localStorage:', error)
  }
  return {
    status: 'todo,in_progress,review',
    priority: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  }
}

export const getTaskNavigationHandlers = (
  projectTasks: any[],
  task: any,
  navigate: (path: string) => void
) => {
  const getCurrentTaskIndex = () => {
    if (!task || !projectTasks.length) return -1
    return projectTasks.findIndex(t => t.id === task.id)
  }

  const handlePreviousTask = () => {
    const currentIndex = getCurrentTaskIndex()
    if (currentIndex > 0) {
      const previousTask = projectTasks[currentIndex - 1]
      navigate(`/todo-for-ai/pages/tasks/${previousTask.id}`)
    }
  }

  const handleNextTask = () => {
    const currentIndex = getCurrentTaskIndex()
    if (currentIndex >= 0 && currentIndex < projectTasks.length - 1) {
      const nextTask = projectTasks[currentIndex + 1]
      navigate(`/todo-for-ai/pages/tasks/${nextTask.id}`)
    }
  }

  return { handlePreviousTask, handleNextTask, getCurrentTaskIndex }
}

export const handleKeyboardNavigation = (
  callback: (action: 'prev' | 'next') => void
) => {
  return (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        callback('prev')
        break
      case 'ArrowRight':
        event.preventDefault()
        callback('next')
        break
    }
  }
}
