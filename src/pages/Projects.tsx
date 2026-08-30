import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../api/projects'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { useProjectStore } from '../stores'
import { ProjectsCardView } from './projects/ProjectsCardView'
import { ProjectsFiltersCard } from './projects/ProjectsFiltersCard'
import { ProjectsHeader } from './projects/ProjectsHeader'
import { ProjectsListView } from './projects/ProjectsListView'
import { createProjectTableColumns } from './projects/createProjectTableColumns'
import { defaultFilters, type ProjectFilters } from './projects/types'
import {
  loadFiltersFromStorage,
  loadViewModeFromStorage,
  saveFiltersToStorage,
  saveViewModeToStorage,
} from './projects/storage'

const Projects = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('projects')

  const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'

  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => loadViewModeFromStorage())
  const [filters, setFilters] = useState<ProjectFilters>(loadFiltersFromStorage)
  const [searchValue, setSearchValue] = useState(filters.search || '')

  const {
    projects,
    loading,
    error,
    pagination,
    fetchProjects,
    deleteProject,
    archiveProject,
    setQueryParams,
    clearError,
  } = useProjectStore()

  const handleFilterChange = useCallback(
    (key: keyof ProjectFilters, value: string) => {
      const newFilters = {
        ...filters,
        [key]: value,
      }
      setFilters(newFilters)
      saveFiltersToStorage(newFilters)
    },
    [filters]
  )

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>
      return (searchTerm: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          handleFilterChange('search', searchTerm)
        }, 500)
      }
    })(),
    [handleFilterChange]
  )

  useEffect(() => {
    const paramsWithPagination = {
      ...filters,
      per_page: viewMode === 'card' ? 100 : 20,
    }
    setQueryParams(paramsWithPagination)
    fetchProjects()
  }, [filters, viewMode, setQueryParams, fetchProjects])

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  useEffect(() => {
    document.title = t('pageTitle')
    return () => {
      document.title = 'Todo for AI'
    }
  }, [t])

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleSearchSubmit = (value: string) => {
    setSearchValue(value)
    handleFilterChange('search', value)
  }

  const handleSearchClear = () => {
    setSearchValue('')
    handleFilterChange('search', '')
  }

  const handleViewModeChange = (mode: 'list' | 'card') => {
    setViewMode(mode)
    saveViewModeToStorage(mode)
  }

  const handleCreate = () => {
    navigate('/todo-for-ai/pages/projects/create')
  }

  const handleEdit = (project: Project) => {
    navigate(`/todo-for-ai/pages/projects/${project.id}/edit`)
  }

  const handleDelete = async (project: Project) => {
    const success = await deleteProject(project.id)
    if (success) {
      message.success(t('messages.deleteSuccess'))
    }
  }

  const handleArchive = async (project: Project) => {
    const success = await archiveProject(project.id)
    if (success) {
      message.success(t('messages.archiveSuccess'))
    }
  }

  const handleTableChange = (tablePagination: any, _filters: any, sorter: any) => {
    const newParams: any = {
      page: tablePagination.current,
      per_page: tablePagination.pageSize,
    }

    if (sorter.field) {
      newParams.sort_by = sorter.field
      newParams.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc'
    }

    setQueryParams(newParams)
    fetchProjects()
  }

  const handleResetFilters = () => {
    setFilters(defaultFilters)
    setSearchValue('')
    saveFiltersToStorage(defaultFilters)
  }

  const columns = useMemo(
    () =>
      createProjectTableColumns({
        t,
        locale,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onArchive: handleArchive,
      }),
    [t, locale, handleEdit, handleDelete, handleArchive]
  )

  return (
    <div className="page-container">
      <ProjectsHeader
        t={t}
        viewMode={viewMode}
        filters={filters}
        searchValue={searchValue}
        loading={loading}
        total={pagination?.total || 0}
        onViewModeChange={handleViewModeChange}
        onRefresh={() => fetchProjects()}
        onCreate={handleCreate}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onSearchClear={handleSearchClear}
      />

      <ProjectsFiltersCard
        t={t}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {viewMode === 'list' ? (
        <ProjectsListView
          t={t}
          columns={columns}
          projects={projects}
          loading={loading}
          pagination={pagination}
          searchKeyword={filters.search}
          onSearchClear={handleSearchClear}
          onCreate={handleCreate}
          onTableChange={handleTableChange}
        />
      ) : (
        <ProjectsCardView
          t={t}
          projects={projects}
          filters={filters}
          pagination={pagination}
          loading={loading}
          onOpenProject={(projectId) => navigate(`/todo-for-ai/pages/projects/${projectId}`)}
          onEditProject={handleEdit}
          onSearchClear={handleSearchClear}
          onCreate={handleCreate}
          onPrevPage={() => {
            const newParams = { ...filters, page: (pagination?.page || 1) - 1 }
            setQueryParams(newParams)
            fetchProjects()
          }}
          onNextPage={() => {
            const newParams = { ...filters, page: (pagination?.page || 1) + 1 }
            setQueryParams(newParams)
            fetchProjects()
          }}
        />
      )}
    </div>
  )
}

export default Projects
