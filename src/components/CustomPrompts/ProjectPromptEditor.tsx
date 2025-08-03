import React, { useState, useEffect } from 'react'
import { Space, Button, message, Modal, Spin, Alert } from 'antd'
import { SaveOutlined, ReloadOutlined, EyeOutlined, BookOutlined, PlusOutlined } from '@ant-design/icons'
import MilkdownEditor from '../MilkdownEditor'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { renderPromptTemplate, type RenderContext } from '../../utils/promptRenderer'
import { customPromptsService } from '../../services/customPromptsService'
import VariableSelector from './VariableSelector'
import ProjectSelector from '../ProjectSelector'
import { apiClient } from '../../api'
import type { Project, Task } from '../../api'

interface ProjectPromptEditorProps {
  onVariableDocsClick?: () => void
}

const ProjectPromptEditor: React.FC<ProjectPromptEditorProps> = ({
  onVariableDocsClick
}) => {
  const { tp } = usePageTranslation('customPrompts')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [variableSelectorVisible, setVariableSelectorVisible] = useState(false)

  // 预览相关状态
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // 默认模板
  const defaultTemplate = tp('projectPrompts.defaultTemplate')

  // 初始化内容
  useEffect(() => {
    // 从服务加载用户自定义的提示词
    const template = customPromptsService.getProjectPromptTemplate()
    setContent(template)
  }, [])



  // 加载项目任务
  const loadProjectTasks = async (projectId: number) => {
    try {
      const url = `/projects/${projectId}/tasks?page=1&per_page=100&status=todo,in_progress,review`
      const response = await apiClient.get<{ items?: Task[] } | Task[]>(url)

      if (response && Array.isArray((response as { items?: Task[] }).items)) {
        setProjectTasks((response as { items: Task[] }).items)
      } else if (response && Array.isArray(response)) {
        setProjectTasks(response as Task[])
      }
    } catch (error) {
      console.error('Failed to load project tasks:', error)
      // 如果加载失败，创建一些示例任务用于演示
      const sampleTasks: Task[] = [
        {
          id: 101,
          project_id: projectId || 1,
          title: '实现用户登录功能',
          content: '需要实现用户登录功能，包括GitHub和Google OAuth',
          status: 'todo',
          priority: 'high',
          completion_rate: 0,
          tags: ['authentication', 'oauth'],
          created_by: 'system',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 102,
          project_id: projectId || 1,
          title: '优化数据库查询性能',
          content: '分析慢查询，优化数据库索引',
          status: 'in_progress',
          priority: 'medium',
          completion_rate: 50,
          tags: ['database', 'performance'],
          created_by: 'system',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 103,
          project_id: projectId || 1,
          title: '编写API文档',
          content: '为所有API接口编写详细的文档',
          status: 'review',
          priority: 'low',
          completion_rate: 80,
          tags: ['documentation', 'api'],
          created_by: 'system',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        }
      ]
      setProjectTasks(sampleTasks)
    }
  }

  // 保存提示词
  const handleSave = async () => {
    setIsLoading(true)
    try {
      // 保存到服务
      await customPromptsService.setProjectPromptTemplate(content)
      message.success(tp('messages.saveSuccess'))
    } catch (error) {
      console.error('Failed to save project prompt:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 重置为默认模板
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: tp('messages.resetConfirm'),
      onOk: async () => {
        try {
          await customPromptsService.resetToDefaults()
          const template = customPromptsService.getProjectPromptTemplate()
          setContent(template)
          message.success('已重置为默认模板')
        } catch (error) {
          console.error('Failed to reset:', error)
          message.error('重置失败，请稍后重试')
        }
      }
    })
  }

  // 预览效果
  const handlePreview = async () => {
    setPreviewVisible(true)
    setPreviewError(null)
  }

  // 处理项目选择
  const handleProjectSelect = async (projectId: number | null, project: Project | null) => {
    setSelectedProjectId(projectId)
    setSelectedProject(project)
    setPreviewLoading(true)
    setPreviewError(null)

    if (projectId && project) {
      try {
        // 加载项目任务
        await loadProjectTasks(projectId)
      } catch (error) {
        console.error('Failed to load project data:', error)
        setPreviewError('加载项目数据失败')
      }
    } else {
      // 清空任务列表
      setProjectTasks([])
    }

    setPreviewLoading(false)
  }

  // 创建示例渲染上下文
  const createSampleContext = (): RenderContext => ({
    project: {
      id: 1,
      name: '示例项目',
      description: '这是一个示例项目的描述',
      github_repo: 'https://github.com/example/project',
      context: '项目上下文信息',
      color: '#1890ff',
      status: 'active',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    system: {
      url: 'https://todo4ai.org',
      current_time: new Date().toISOString()
    },
    tasks: {
      count: 5,
      list: '1. [高] 示例任务1 (ID: 1)\n2. [中] 示例任务2 (ID: 2)\n3. [低] 示例任务3 (ID: 3)',
      pending_count: 3,
      in_progress_count: 1,
      review_count: 1
    }
  })

  // 创建真实数据渲染上下文
  const createRealContext = (): RenderContext | null => {
    if (!selectedProject) return null

    // 统计任务状态
    const todoTasks = projectTasks.filter(t => t.status === 'todo')
    const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress')
    const reviewTasks = projectTasks.filter(t => t.status === 'review')

    // 格式化任务列表
    const formatTasksList = (tasks: Task[]) => {
      return tasks.map((task, index) => {
        const priorityMap: Record<string, string> = {
          'high': '高',
          'medium': '中',
          'low': '低',
          'urgent': '紧急'
        }
        const priority = priorityMap[task.priority] || task.priority
        return `${index + 1}. [${priority}] ${task.title} (ID: ${task.id})`
      }).join('\n')
    }

    return {
      project: {
        id: selectedProject.id,
        name: selectedProject.name,
        description: selectedProject.description || '无描述',
        github_repo: (selectedProject as any).github_repo || '无',
        context: (selectedProject as any).context || '无',
        color: selectedProject.color || '#1890ff',
        status: selectedProject.status,
        created_at: selectedProject.created_at,
        updated_at: selectedProject.updated_at
      },
      system: {
        url: 'https://todo4ai.org',
        current_time: new Date().toISOString()
      },
      tasks: {
        count: projectTasks.length,
        list: formatTasksList([...todoTasks, ...inProgressTasks, ...reviewTasks]),
        pending_count: todoTasks.length,
        in_progress_count: inProgressTasks.length,
        review_count: reviewTasks.length
      }
    }
  }

  // 渲染预览
  const renderPreview = (template: string) => {
    // 如果选择了项目且有数据，使用真实数据
    if (selectedProject && projectTasks.length >= 0) {
      const realContext = createRealContext()
      if (realContext) {
        return renderPromptTemplate(template, realContext)
      }
    }

    // 否则使用示例数据
    const context = createSampleContext()
    return renderPromptTemplate(template, context)
  }

  // 插入变量
  const handleInsertVariable = (variable: string) => {
    setContent(prev => prev + variable)
    setVariableSelectorVisible(false)
  }

  return (
    <div>
      <Space style={{ marginBottom: '16px' }}>
        <Button
          type="link"
          icon={<BookOutlined />}
          onClick={onVariableDocsClick}
        >
          {tp('variables.viewDocs')}
        </Button>
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => setVariableSelectorVisible(true)}
        >
          插入变量
        </Button>
      </Space>

      <div style={{ marginBottom: '16px' }}>
        <MilkdownEditor
          value={content}
          onChange={setContent}
          placeholder={tp('projectPrompts.placeholder')}
          height="400px"
          autoSave={false}
        />
      </div>

      <Space>
        <Button 
          type="primary" 
          icon={<SaveOutlined />}
          loading={isLoading}
          onClick={handleSave}
        >
          {tp('buttons.save')}
        </Button>
        <Button 
          icon={<ReloadOutlined />}
          onClick={handleReset}
        >
          {tp('buttons.reset')}
        </Button>
        <Button 
          icon={<EyeOutlined />}
          onClick={handlePreview}
        >
          {tp('buttons.preview')}
        </Button>
      </Space>

      {/* 预览模态框 */}
      <Modal
        title={tp('messages.previewTitle')}
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false)
          setSelectedProjectId(null)
          setSelectedProject(null)
          setProjectTasks([])
          setPreviewError(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setPreviewVisible(false)
            setSelectedProjectId(null)
            setSelectedProject(null)
            setProjectTasks([])
            setPreviewError(null)
          }}>
            关闭
          </Button>,
          <Button
            key="copy"
            type="primary"
            disabled={!content}
            onClick={() => {
              navigator.clipboard.writeText(renderPreview(content))
              message.success(tp('messages.copySuccess'))
            }}
          >
            {tp('buttons.copy')}
          </Button>
        ]}
        width={900}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            选择项目进行预览（可选）：
          </div>
          <ProjectSelector
            style={{ width: '100%' }}
            placeholder="选择一个项目来使用真实数据预览，或留空使用示例数据"
            allowClear
            value={selectedProjectId}
            onChange={handleProjectSelect}
            loading={previewLoading}
            showSearch
          />
          {selectedProject && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#e6f7ff',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              已选择项目：<strong>{selectedProject.name}</strong> |
              任务数量：<strong>{projectTasks.length}</strong>
              {selectedProject.description && (
                <>
                  <br />
                  项目描述：<span style={{ color: '#666' }}>{selectedProject.description}</span>
                </>
              )}
            </div>
          )}
        </div>

        {previewError && (
          <Alert
            message="预览错误"
            description={previewError}
            type="error"
            style={{ marginBottom: '16px' }}
          />
        )}

        <Spin spinning={previewLoading}>
          <div style={{
            maxHeight: '500px',
            overflow: 'auto',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            {renderPreview(content)}
          </div>
        </Spin>
      </Modal>

      {/* 变量选择器 */}
      <VariableSelector
        visible={variableSelectorVisible}
        onClose={() => setVariableSelectorVisible(false)}
        onInsertVariable={handleInsertVariable}
      />
    </div>
  )
}

export default ProjectPromptEditor
