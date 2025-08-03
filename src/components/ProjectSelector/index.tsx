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

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await projectsApi.getProjects({
        page: 1,
        per_page: 1000, // 加载更多项目以支持搜索
        status: 'active' // 只加载活跃项目
      })

      let projectList: Project[] = []
      if (response.data && Array.isArray(response.data)) {
        projectList = response.data
      } else if (response.data && Array.isArray((response.data as any)?.data)) {
        projectList = (response.data as any).data
      }

      setProjects(projectList)
    } catch (error) {
      console.error('Failed to load projects:', error)
      // 如果加载失败，设置空数组
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载项目
  useEffect(() => {
    loadProjects()
  }, [])

  // 创建项目选项
  const projectOptions: ProjectOption[] = useMemo(() => {
    return projects.map(project => {
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
  }, [projects])

  // 过滤选项
  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) {
      return projectOptions
    }
    
    const searchLower = searchValue.toLowerCase()
    return projectOptions.filter(option => 
      option.searchText.includes(searchLower)
    )
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
