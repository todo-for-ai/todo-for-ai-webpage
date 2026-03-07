import { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Tabs, Spin, Button, Space, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  EditOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
} from '@ant-design/icons'
import { useProjectStore } from '../stores'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { TaskListSection } from '../components/ProjectDetail/TaskListSection'
import { StatisticsSection } from '../components/ProjectDetail/StatisticsSection'
import { ProjectInfoSection } from '../components/ProjectDetail/ProjectInfoSection'
import { ContextRulesTab } from '../components/ProjectDetail/ContextRulesTab'
import { ProjectMembersTab } from '../components/ProjectDetail/ProjectMembersTab'
import { useProjectPin } from '../hooks/useProjectPin'
import NotificationChannelManager from '../components/NotificationChannelManager'

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { tp, tc } = usePageTranslation('projectDetail')

  const {
    currentProject,
    loading: projectLoading,
    fetchProject
  } = useProjectStore()

  const { isPinned, pinLoading, checkPinStatus, handleTogglePin } = useProjectPin(id || '0')

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

  useEffect(() => {
    checkPinStatus()
  }, [checkPinStatus])

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

  const handleEditProject = () => {
    if (!id) return
    navigate(`/todo-for-ai/pages/projects/${id}/edit`)
  }

  const handleCreateTask = () => {
    if (!id) return
    navigate(`/todo-for-ai/pages/tasks/create?project_id=${id}`)
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
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/todo-for-ai/pages/projects')}>
              {tc('actions.back')}
            </Button>
            <span style={{ color: '#999' }}>|</span>
            <HomeOutlined style={{ color: '#1890ff' }} />
            <span style={{ color: '#666' }}>{currentProject.name}</span>
            <Tag color={currentProject.status === 'active' ? 'green' : 'orange'}>
              {tp(`status.${currentProject.status}`)}
            </Tag>
          </div>
          <Space size="small">
            <Button
              icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
              onClick={handleTogglePin}
              loading={pinLoading}
              type={isPinned ? 'primary' : 'default'}
            >
              {isPinned ? tp('buttons.pinned') : tp('buttons.pin')}
            </Button>
            <Button icon={<EditOutlined />} onClick={handleEditProject}>
              {tp('buttons.editProject')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTask}>
              {tp('buttons.newTask')}
            </Button>
          </Space>
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
            },
            {
              key: 'members',
              label: tp('overview.tabs.members'),
              children: (
                <ProjectMembersTab
                  projectId={parseInt(id || '0')}
                  workspaceId={currentProject.organization_id}
                  currentUserRole={currentProject.current_user_role}
                />
              )
            },
            {
              key: 'notifications',
              label: '通知设置',
              children: (
                <NotificationChannelManager
                  scopeType="project"
                  scopeId={parseInt(id || '0')}
                  title="项目通知设置"
                  description="配置当前项目的外部通知同步渠道。"
                  canManage={['owner', 'maintainer'].includes(currentProject.current_user_role || '')}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default ProjectDetail
