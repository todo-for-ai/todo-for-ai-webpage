import React, { useState, useEffect } from 'react'
import { Space, Button, message, Modal, Spin, Alert } from 'antd'
import { SaveOutlined, ReloadOutlined, EyeOutlined, BookOutlined, PlusOutlined } from '@ant-design/icons'
import MilkdownEditor from '../MilkdownEditor'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { renderPromptTemplate, buildContextRulesData, type RenderContext, type ContextRuleData } from '../../utils/promptRenderer'
import { customPromptsService } from '../../services/customPromptsService'
import VariableSelector from './VariableSelector'
import ProjectSelector from '../ProjectSelector'
import { apiClient } from '../../api'
import { contextRulesApi } from '../../api/contextRules'
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
  const [globalContextRules, setGlobalContextRules] = useState<ContextRuleData[]>([])
  const [projectContextRules, setProjectContextRules] = useState<ContextRuleData[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // 默认模板
  const defaultTemplate = tp('projectPrompts.defaultTemplate')

  // 初始化内容
  useEffect(() => {
    // 从服务加载用户自定义的提示词
    const template = customPromptsService.getProjectPromptTemplate()
    setContent(template)

    // 加载全局上下文规则
    loadGlobalContextRules()
  }, [])

  // 加载全局上下文规则
  const loadGlobalContextRules = async () => {
    try {
      const response = await contextRulesApi.getGlobalContextRules()
      if (response && Array.isArray(response)) {
        setGlobalContextRules(response.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          content: rule.content,
          priority: rule.priority,
          is_active: rule.is_active,
          is_global: rule.is_global,
          project_id: rule.project_id
        })))
      }
    } catch (error) {
      console.error('Failed to load global context rules:', error)
      // 创建一些示例全局规则用于演示
      setGlobalContextRules([
        {
          id: 1,
          name: tp('sampleData.contextRules.codingStandards.name'),
          description: tp('sampleData.contextRules.codingStandards.description'),
          content: '* 使用TypeScript进行开发\n* 遵循ESLint规则\n* 代码需要有适当的注释',
          priority: 10,
          is_active: true,
          is_global: true
        },
        {
          id: 2,
          name: tp('sampleData.contextRules.testRequirements.name'),
          description: tp('sampleData.contextRules.testRequirements.description'),
          content: '* 所有功能都需要编写单元测试\n* 使用Jest作为测试框架\n* 测试覆盖率需要达到80%以上',
          priority: 5,
          is_active: true,
          is_global: true
        }
      ])
    }
  }

  // 加载项目上下文规则
  const loadProjectContextRules = async (projectId: number) => {
    try {
      const response = await contextRulesApi.getContextRules({ project_id: projectId })
      if (response && response.items && Array.isArray(response.items)) {
        setProjectContextRules(response.items.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          content: rule.content,
          priority: rule.priority,
          is_active: rule.is_active,
          is_global: rule.is_global,
          project_id: rule.project_id
        })))
      }
    } catch (error) {
      console.error('Failed to load project context rules:', error)
      // 创建一些示例项目规则用于演示
      setProjectContextRules([
        {
          id: 101,
          name: tp('sampleData.contextRules.projectSpecific.name'),
          description: tp('sampleData.contextRules.projectSpecific.description'),
          content: '* 使用React Hooks进行状态管理\n* 组件需要支持国际化\n* 所有API调用需要错误处理',
          priority: 15,
          is_active: true,
          is_global: false,
          project_id: projectId
        }
      ])
    }
  }

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
          title: tp('sampleData.tasks.loginFeature'),
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
          title: tp('sampleData.tasks.dbOptimization'),
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
          title: tp('sampleData.tasks.apiDocs'),
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
      message.error(tp('messages.saveFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 重置为默认模板
  const handleReset = () => {
    Modal.confirm({
      title: tp('messages.resetTitle'),
      content: tp('messages.resetConfirm'),
      onOk: async () => {
        try {
          await customPromptsService.resetToDefaults()
          const template = customPromptsService.getProjectPromptTemplate()
          setContent(template)
          message.success(tp('messages.resetSuccess'))
        } catch (error) {
          console.error('Failed to reset:', error)
          message.error(tp('messages.resetFailed'))
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
        // 加载项目任务和上下文规则
        await Promise.all([
          loadProjectTasks(projectId),
          loadProjectContextRules(projectId)
        ])
      } catch (error) {
        console.error('Failed to load project data:', error)
        setPreviewError(tp('messages.previewLoadFailed'))
      }
    } else {
      // 清空任务列表和项目规则
      setProjectTasks([])
      setProjectContextRules([])
    }

    setPreviewLoading(false)
  }

  // 创建示例渲染上下文
  const createSampleContext = (): RenderContext => {
    // 创建示例上下文规则数据
    const sampleGlobalRules: ContextRuleData[] = [
      {
        id: 1,
        name: tp('sampleData.contextRules.codingStandards.name'),
        description: tp('sampleData.contextRules.codingStandards.description'),
        content: '* 使用TypeScript进行开发\n* 遵循ESLint规则\n* 代码需要有适当的注释',
        priority: 10,
        is_active: true,
        is_global: true
      },
      {
        id: 2,
        name: tp('sampleData.contextRules.testRequirements.name'),
        description: tp('sampleData.contextRules.testRequirements.description'),
        content: '* 所有功能都需要编写单元测试\n* 使用Jest作为测试框架\n* 测试覆盖率需要达到80%以上',
        priority: 5,
        is_active: true,
        is_global: true
      }
    ]

    const sampleProjectRules: ContextRuleData[] = [
      {
        id: 101,
        name: tp('sampleData.contextRules.projectSpecific.name'),
        description: tp('sampleData.contextRules.projectSpecific.description'),
        content: '* 使用React Hooks进行状态管理\n* 组件需要支持国际化\n* 所有API调用需要错误处理',
        priority: 15,
        is_active: true,
        is_global: false,
        project_id: 1
      }
    ]

    return {
      project: {
        id: 1,
        name: tp('sampleData.projectName'),
        description: tp('sampleData.projectDescription'),
        github_repo: 'https://github.com/example/project',
        context: tp('sampleData.projectContext'),
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
        list: tp('sampleData.taskList'),
        pending_count: 3,
        in_progress_count: 1,
        review_count: 1
      },
      context_rules: buildContextRulesData(sampleGlobalRules, sampleProjectRules)
    }
  }

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
          'high': tp('priority.high'),
          'medium': tp('priority.medium'),
          'low': tp('priority.low'),
          'urgent': tp('priority.urgent')
        }
        const priority = priorityMap[task.priority] || task.priority
        return `${index + 1}. [${priority}] ${task.title} (ID: ${task.id})`
      }).join('\n')
    }

    return {
      project: {
        id: selectedProject.id,
        name: selectedProject.name,
        description: selectedProject.description || tp('messages.noDescription'),
        github_repo: (selectedProject as any).github_repo || tp('messages.none'),
        context: (selectedProject as any).context || tp('messages.none'),
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
      },
      context_rules: buildContextRulesData(globalContextRules, projectContextRules)
    }
  }

  // 渲染预览
  const renderPreview = (template: string) => {
    // 如果选择了项目且数据加载完成且没有错误，使用真实数据
    if (selectedProject && !previewLoading && !previewError) {
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
          {tp('variables.insertVariable')}
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
            {tp('messages.close')}
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
            {tp('messages.selectProjectForPreview')}
          </div>
          <ProjectSelector
            style={{ width: '100%' }}
            placeholder={tp('messages.selectProjectPlaceholder')}
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
              {tp('messages.selectedProject')}<strong>{selectedProject.name}</strong> |
              {tp('messages.taskCount')}<strong>{projectTasks.length}</strong>
              {selectedProject.description && (
                <>
                  <br />
                  {tp('messages.projectDescription')}<span style={{ color: '#666' }}>{selectedProject.description}</span>
                </>
              )}
            </div>
          )}
        </div>

        {previewError && (
          <Alert
            message={tp('messages.previewError')}
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
