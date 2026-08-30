import { defaultFilters, type ProjectFilters, type ProjectsViewMode } from './types'

const PROJECTS_VIEW_MODE_KEY = 'projects-view-mode'
const PROJECTS_FILTERS_KEY = 'projects-filters'

export const loadViewModeFromStorage = (): ProjectsViewMode => {
  try {
    const saved = localStorage.getItem(PROJECTS_VIEW_MODE_KEY)
    return saved === 'card' ? 'card' : 'list'
  } catch (error) {
    console.warn('Failed to load view mode from localStorage:', error)
    return 'list'
  }
}

export const saveViewModeToStorage = (mode: ProjectsViewMode): void => {
  try {
    localStorage.setItem(PROJECTS_VIEW_MODE_KEY, mode)
  } catch (error) {
    console.warn('Failed to save view mode to localStorage:', error)
  }
}

export const loadFiltersFromStorage = (): ProjectFilters => {
  try {
    const saved = localStorage.getItem(PROJECTS_FILTERS_KEY)
    if (saved) {
      return { ...defaultFilters, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error)
  }
  return defaultFilters
}

export const saveFiltersToStorage = (filters: ProjectFilters): void => {
  try {
    localStorage.setItem(PROJECTS_FILTERS_KEY, JSON.stringify(filters))
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error)
  }
}
