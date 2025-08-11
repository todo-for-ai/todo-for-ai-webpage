import React, { useState, useEffect, useMemo } from 'react'
import { Select, Spin } from 'antd'
import { ProjectOutlined } from '@ant-design/icons'
import { projectsApi } from '../../api/projects'
import type { Project } from '../../api/projects'

export interface ProjectSelectorProps {
  value?: number | null
  onChange?: (projectId: number | null, project?: Project | null) => void
  placeholder?: string
  allowClear?: boolean
  style?: React.CSSProperties
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
  loading?: boolean
  showSearch?: boolean
  filterOption?: boolean
  // 支持Form.Item的简单模式，只传递value而不传递project对象
  simpleMode?: boolean
  // 可选：外部提供的项目列表，如果提供则不会自动加载
  projects?: Project[]
}

interface ProjectOption {
  label: React.ReactNode
  value: number
  project: Project
  searchText: string
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  value,
  onChange,
  placeholder = '请选择项目',
  allowClear = true,
  style,
  size = 'middle',
  disabled = false,
  loading: externalLoading = false,
  showSearch = true,
  filterOption = false,
  simpleMode = false
}) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  // 用于存储额外加载的项目（当value不在当前项目列表中时）
  const [additionalProject, setAdditionalProject] = useState<Project | null>(null)

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true)
    // 不要清空现有数据，保持用户体验的连续性
    // setProjects([]) // 移除这行，避免在加载时显示空列表

    try {
      const response = await projectsApi.getProjects({
        page: 1,
        per_page: 1000, // 加载更多项目以支持搜索
        status: 'active' // 只加载活跃项目
      })

      let projectList: Project[] = []

      // 处理不同的API响应格式
      if (response && Array.isArray((response as any)?.items)) {
        // 新的API格式：{items: Array, pagination: Object}
        projectList = (response as any).items
      } else if (response && Array.isArray((response as any)?.data)) {
        // 标准API格式：{data: Array}
        projectList = (response as any).data
      } else if (response && Array.isArray(response)) {
        // 直接数组格式
        projectList = response as Project[]
      }

      console.log('ProjectSelector: Loaded projects:', projectList)
      setProjects(projectList)
    } catch (error) {
      console.error('ProjectSelector: Failed to load projects:', error)
      // 如果加载失败，只在没有现有数据时才设置空数组
      setProjects(prevProjects => prevProjects.length > 0 ? prevProjects : [])
    } finally {
      setLoading(false)
    }
  }

  // 强制刷新项目列表
  const refreshProjects = () => {
    console.log('ProjectSelector: Force refreshing projects...')
    loadProjects()
  }

  // 组件挂载时加载项目
  useEffect(() => {
    loadProjects()
  }, [])

  // 单独加载项目的函数
  const loadProjectById = async (projectId: number) => {
    try {
      console.log('ProjectSelector: Loading project by ID:', projectId)
      const response = await projectsApi.getProject(projectId)

      // 处理不同的API响应格式
      let project: Project | null = null
      if (response && typeof response === 'object') {
        if ((response as any)?.data) {
          // 标准API格式：{data: Project}
          project = (response as any).data
        } else if ((response as any)?.id) {
          // 直接项目对象格式
          project = response as Project
        }
      }

      console.log('ProjectSelector: Loaded additional project:', project)
      setAdditionalProject(project)
    } catch (error) {
      console.error('ProjectSelector: Failed to load project by id:', error)
      setAdditionalProject(null)
    }
  }

  // 监听value变化，当value不在当前项目列表中时加载项目详情
  useEffect(() => {
    if (value && projects.length > 0) {
      const existingProject = projects.find(p => p.id === value)
      if (!existingProject) {
        // 项目不在当前列表中，需要单独加载
        console.log('ProjectSelector: Value not found in current projects, loading by ID:', value)
        loadProjectById(value)
      } else {
        // 项目在当前列表中，清除额外加载的项目
        console.log('ProjectSelector: Value found in current projects, clearing additional project')
        setAdditionalProject(null)
      }
    } else if (!value) {
      // 没有选中值，清除额外加载的项目
      setAdditionalProject(null)
    }
  }, [value, projects])

  // 添加一个全局方法用于调试
  useEffect(() => {
    (window as any).refreshProjectSelector = refreshProjects
    return () => {
      delete (window as any).refreshProjectSelector
    }
  }, [])

  // 创建项目选项
  const projectOptions: ProjectOption[] = useMemo(() => {
    console.log('ProjectSelector: Creating project options from projects:', projects)
    const options = projects.map(project => {
      // 创建搜索文本，包含项目名称和描述
      const searchText = `${project.name} ${project.description || ''}`.toLowerCase()

      return {
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: project.color || '#1890ff',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {project.name}
              </div>
              {project.description && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {project.description}
                </div>
              )}
            </div>
          </div>
        ),
        value: project.id,
        project,
        searchText
      }
    })
    console.log('ProjectSelector: Generated project options:', options)
    return options
  }, [projects])

  // 获取选中项目的显示标签（只显示项目名称）
  const getSelectedLabel = (projectId: number | null) => {
    if (!projectId) return undefined

    // 优先从当前项目列表中查找
    let project = projects.find(p => p.id === projectId)

    // 如果没找到，使用额外加载的项目
    if (!project && additionalProject && additionalProject.id === projectId) {
      project = additionalProject
      console.log('ProjectSelector: Using additional project for label:', project)
    }

    if (!project) {
      console.log('ProjectSelector: No project found for ID:', projectId)
      return undefined
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            backgroundColor: project.color || '#1890ff',
            flexShrink: 0
          }}
        />
        <span style={{
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {project.name}
        </span>
        {/* 如果是额外加载的项目，显示状态提示 */}
        {additionalProject && additionalProject.id === projectId && project.status === 'archived' && (
          <span style={{
            fontSize: '10px',
            color: '#999',
            backgroundColor: '#f5f5f5',
            padding: '1px 4px',
            borderRadius: '2px',
            marginLeft: '4px'
          }}>
            已归档
          </span>
        )}
      </div>
    )
  }

  // 过滤选项
  const filteredOptions = useMemo(() => {
    console.log('ProjectSelector: Filtering options with searchValue:', searchValue)
    console.log('ProjectSelector: Available projectOptions:', projectOptions)

    if (!searchValue.trim()) {
      console.log('ProjectSelector: No search value, returning all options:', projectOptions)
      return projectOptions
    }

    const searchLower = searchValue.toLowerCase()
    const filtered = projectOptions.filter(option =>
      option.searchText.includes(searchLower)
    )
    console.log('ProjectSelector: Filtered options:', filtered)
    return filtered
  }, [projectOptions, searchValue])

  // 处理选择变化
  const handleChange = (selectedValue: number | null) => {
    if (simpleMode) {
      // 简单模式：只传递value，用于Form.Item
      onChange?.(selectedValue)
    } else {
      // 完整模式：传递value和project对象
      const selectedProject = selectedValue
        ? projects.find(p => p.id === selectedValue) || null
        : null

      onChange?.(selectedValue, selectedProject)
    }
  }

  // 处理搜索
  const handleSearch = (searchText: string) => {
    setSearchValue(searchText)
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      style={style}
      size={size}
      disabled={disabled || loading || externalLoading}
      loading={loading || externalLoading}
      showSearch={showSearch}
      filterOption={filterOption}
      onSearch={showSearch ? handleSearch : undefined}
      options={filteredOptions}
      optionFilterProp="children"
      // 使用optionLabelProp来控制选中后显示的内容
      optionLabelProp="children"
      // 自定义选中项的渲染
      labelRender={({ value: selectedValue }) => getSelectedLabel(selectedValue as number)}
      notFoundContent={
        loading || externalLoading ? (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <Spin size="small" />
            <span style={{ marginLeft: '8px' }}>加载中...</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px', color: '#999' }}>
            <ProjectOutlined style={{ marginRight: '4px' }} />
            {searchValue ? '未找到匹配的项目' : '暂无项目'}
          </div>
        )
      }
      dropdownStyle={{ maxHeight: '300px' }}
    />
  )
}

export default ProjectSelector
