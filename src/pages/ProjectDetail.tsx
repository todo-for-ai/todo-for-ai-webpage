import { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Tabs, Spin, Button } from 'antd'
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { TaskListSection } from '../components/ProjectDetail/TaskListSection'
import { StatisticsSection } from '../components/ProjectDetail/StatisticsSection'
import { ProjectInfoSection } from '../components/ProjectDetail/ProjectInfoSection'
import { ContextRulesTab } from '../components/ProjectDetail/ContextRulesTab'
import { LinkButton } from '../components/SmartLink'
import { useProjectPin } from '../hooks/useProjectPin'
import { useTaskFilters } from '../hooks/useTaskFilters'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { tp } = usePageTranslation('projectDetail')

  const {
    currentProject,
    loading: projectLoading,
    fetchProject
  } = useProjectStore()

  const { isPinned, handleTogglePin } = useProjectPin(id || '0')
  const { taskFilters, setTaskFilters } = useTaskFilters()

  useEffect(() => {
    if (id) {
      fetchProject(parseInt(id))
    }
  }, [id, fetchProject])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      // Tab is managed by Tabs component
    }
  }, [searchParams])

  const handleTabChange = (activeKey: string) => {
    setSearchParams({ tab: activeKey })
  }

  const handleTableChange = (params: any) => {
    // Handle table parameter changes
    console.log('Table params changed:', params)
  }

  const handleRefreshTasks = async () => {
    // Refresh is handled by TaskListSection hook
    return Promise.resolve()
  }

  if (projectLoading || !currentProject) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  const projectStats = {
    total_tasks: currentProject.stats?.total_tasks || 0,
    todo_tasks: currentProject.stats?.todo_tasks || 0,
    in_progress_tasks: currentProject.stats?.in_progress_tasks || 0,
    done_tasks: currentProject.stats?.done_tasks || 0,
    context_rules_count: currentProject.stats?.context_rules_count || 0
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 - 面包屑导航 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/todo-for-ai/pages/projects')}
            >
              {tp('navigation.backToProjects')}
            </Button>
            <span style={{ color: '#999' }}>|</span>
            <HomeOutlined style={{ color: '#1890ff' }} />
            <span style={{ color: '#666' }}>{currentProject.name}</span>
          </div>
          <div>
            <Button
              onClick={handleTogglePin}
            >
              {isPinned ? tp('pinManager.unpin') : tp('pinManager.pin')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 项目统计信息 */}
      <StatisticsSection stats={projectStats} />

      {/* 主要内容区域 */}
      <Card>
        <Tabs
          activeKey={searchParams.get('tab') || 'tasks'}
          onChange={handleTabChange}
          items={[
            {
              key: 'tasks',
              label: tp('overview.tabs.tasks'),
              children: (
                <TaskListSection
                  projectId={id || ''}
                  onTableChange={handleTableChange}
                  onRefresh={handleRefreshTasks}
                />
              )
            },
            {
              key: 'overview',
              label: tp('overview.tabs.overview'),
              children: (
                <ProjectInfoSection project={currentProject} />
              )
            },
            {
              key: 'context-rules',
              label: tp('overview.tabs.contextRules'),
              children: (
                <ContextRulesTab projectId={parseInt(id || '0')} />
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default ProjectDetail
