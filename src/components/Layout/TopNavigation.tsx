import React, { useState, useEffect, useRef } from 'react'
import { Layout, Menu, Typography, Badge } from 'antd'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  DashboardOutlined,
  ProjectOutlined,
  // RobotOutlined, // 未使用
  AppstoreOutlined,
  ApiOutlined,
  PushpinOutlined
} from '@ant-design/icons'
import { UserAvatar } from '../UserProfile'
import { LinkButton } from '../SmartLink'
import { GitHubBadge } from '../GitHubBadge'
import { pinsApi, type UserProjectPin, type ProjectTaskCount } from '../../api/pins'
import { tasksApi } from '../../api/tasks'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import './TopNavigation.css'

const { Header } = Layout
const { Title } = Typography

const TopNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [pinnedProjects, setPinnedProjects] = useState<UserProjectPin[]>([])
  const [currentTaskProjectId, setCurrentTaskProjectId] = useState<number | null>(null)
  const [taskCounts, setTaskCounts] = useState<ProjectTaskCount[]>([])
  const { tn } = useTranslation()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 加载Pin的项目
  const loadPinnedProjects = async () => {
    try {
      console.log('开始加载Pin项目...')
      const response = await pinsApi.getUserPins()
      console.log('Pin API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', response ? Object.keys(response) : 'null')

      // 处理标准API响应格式 {data: {...}, message: ..., success: ...}
      const data = response?.data || response

      if (data && data.pins) {
        console.log('Pin projects:', data.pins)
        data.pins.forEach((pin, index) => {
          console.log(`Pin ${index}:`, pin)
          console.log(`Pin ${index} project:`, pin.project)
        })
        // 按照pin_order排序
        const sortedPins = data.pins.sort((a: any, b: any) => (a.pin_order || 0) - (b.pin_order || 0))
        setPinnedProjects(sortedPins)

        // 如果有Pin项目，立即加载任务数量
        if (sortedPins.length > 0) {
          loadTaskCounts()
        } else {
          setTaskCounts([])
        }
      } else {
        console.log('No pins found or invalid response')
        setPinnedProjects([])
        setTaskCounts([])
      }
    } catch (error) {
      console.error('Failed to load pinned projects:', error)
      setPinnedProjects([])
      setTaskCounts([])
    }
  }

  // 加载Pin项目的任务数量
  const loadTaskCounts = async () => {
    try {
      const response = await pinsApi.getPinnedProjectsTaskCounts()
      const data = response?.data || response

      if (data && data.task_counts) {
        setTaskCounts(data.task_counts)
      } else {
        setTaskCounts([])
      }
    } catch (error) {
      console.error('Failed to load task counts:', error)
      setTaskCounts([])
    }
  }

  useEffect(() => {
    loadPinnedProjects()

    // 监听Pin更新事件
    const handlePinUpdate = () => {
      loadPinnedProjects()
    }

    window.addEventListener('pinUpdated', handlePinUpdate)

    return () => {
      window.removeEventListener('pinUpdated', handlePinUpdate)
    }
  }, [])

  // 设置任务数量轮询
  useEffect(() => {
    // 清除之前的轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // 如果有Pin项目，设置轮询
    if (pinnedProjects.length > 0) {
      // 立即加载一次
      loadTaskCounts()

      // 每10秒轮询一次
      pollingIntervalRef.current = setInterval(() => {
        loadTaskCounts()
      }, 10000)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [pinnedProjects.length])

  // 获取项目的任务数量
  const getProjectTaskCount = (projectId: number): number => {
    const taskCount = taskCounts.find(tc => tc.project_id === projectId)
    return taskCount?.pending_tasks || 0
  }

  // 主要菜单项（左侧）
  const mainMenuItems = [
    {
      key: '/todo-for-ai/pages',
      icon: <DashboardOutlined />,
      label: tn('menu.dashboard'),
    },
    {
      key: '/todo-for-ai/pages/rule-marketplace',
      icon: <AppstoreOutlined />,
      label: tn('menu.rules'),
    },
    {
      key: '/todo-for-ai/pages/projects',
      icon: <ProjectOutlined />,
      label: tn('menu.projects'),
    },
    // 添加Pin的项目菜单项
    ...pinnedProjects.map(pin => {
      const projectId = pin.project?.id || pin.project_id
      const taskCount = getProjectTaskCount(projectId)
      const projectColor = pin.project?.color || '#1890ff'

      return {
        key: `/todo-for-ai/pages/projects/${projectId}`,
        icon: <PushpinOutlined style={{ color: projectColor }} />,
        label: (
          <div style={{ display: 'inline-block' }}>
            <span
              style={{
                position: 'relative',
                display: 'inline-block'
              }}
            >
              {pin.project?.name || tn('menu.pinnedProject', { projectId: pin.project_id })}
              {taskCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '-6px',
                    backgroundColor: projectColor,
                    color: '#fff',
                    fontSize: '10px',
                    minWidth: '16px',
                    height: '16px',
                    lineHeight: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 1px #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  {taskCount}
                </span>
              )}
            </span>
          </div>
        ),
      }
    })
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  // 检测当前是否在任务相关页面，并获取项目ID
  useEffect(() => {
    const detectTaskProjectId = async () => {
      const pathname = location.pathname

      // 检测任务详情页面：/todo-for-ai/pages/tasks/123
      const taskDetailMatch = pathname.match(/^\/todo-for-ai\/pages\/tasks\/(\d+)$/)
      // 检测编辑任务页面：/todo-for-ai/pages/tasks/123/edit
      const taskEditMatch = pathname.match(/^\/todo-for-ai\/pages\/tasks\/(\d+)\/edit$/)
      // 检测新建任务页面：/todo-for-ai/pages/tasks/create
      const taskCreateMatch = pathname.match(/^\/todo-for-ai\/pages\/tasks\/create$/)

      if (taskDetailMatch || taskEditMatch) {
        // 任务详情或编辑页面，通过task_id获取项目ID
        const taskId = parseInt(taskDetailMatch?.[1] || taskEditMatch?.[1] || '0', 10)
        if (taskId) {
          try {
            const response = await tasksApi.getTask(taskId)
            if (response.data && response.data.project_id) {
              setCurrentTaskProjectId(response.data.project_id)
            } else {
              setCurrentTaskProjectId(null)
            }
          } catch (error) {
            console.error('Failed to get task project ID:', error)
            setCurrentTaskProjectId(null)
          }
        }
      } else if (taskCreateMatch) {
        // 新建任务页面，从URL参数获取项目ID
        const projectIdParam = searchParams.get('project_id')
        if (projectIdParam) {
          setCurrentTaskProjectId(parseInt(projectIdParam, 10))
        } else {
          setCurrentTaskProjectId(null)
        }
      } else {
        // 不在任务页面，清除项目ID
        setCurrentTaskProjectId(null)
      }
    }

    detectTaskProjectId()
  }, [location.pathname, searchParams])

  // 计算应该选中的菜单项
  const getSelectedKeys = () => {
    // 如果在任务页面且找到了项目ID，检查该项目是否被pin了
    if (currentTaskProjectId) {
      const pinnedProject = pinnedProjects.find(pin =>
        pin.project_id === currentTaskProjectId || pin.project?.id === currentTaskProjectId
      )
      if (pinnedProject) {
        return [`/todo-for-ai/pages/projects/${currentTaskProjectId}`]
      }
    }

    // 默认使用当前路径
    return [location.pathname]
  }

  // 重新加载Pin项目列表
  const reloadPinnedProjects = async () => {
    await loadPinnedProjects()
  }

  return (
    <Header
      className="top-navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // 改为居中对齐
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        height: '64px',
      }}
    >
      {/* 左侧：Logo - 绝对定位到左边 */}
      <div
        className="logo-section"
        onClick={() => navigate('/todo-for-ai/pages')}
      >
        <img
          src="/todo-for-ai-logo.png"
          alt="Todo for AI Logo"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'cover'
          }}
        />
        <Title
          level={4}
          style={{
            margin: 0,
            color: '#1890ff',
            fontSize: '18px',
            fontWeight: 600
          }}
        >
          Todo for AI
        </Title>
      </div>

      {/* 中间：主要菜单 - 居中显示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: '1',
        justifyContent: 'center',
        maxWidth: 'calc(100% - 400px)' // 为左右两侧留出空间
      }}>
        {/* 主要菜单 */}
        <Menu
          mode="horizontal"
          selectedKeys={getSelectedKeys()}
          items={mainMenuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
            minWidth: 'auto',
            flex: '1 1 auto'
          }}
          overflowedIndicator={null}
        />
      </div>

      {/* GitHub徽标 - 紧贴右上角的倒三角形设计 */}
      <GitHubBadge
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          zIndex: 1001
        }}
      />

      {/* 右侧：文档链接 + 用户区域 - 紧贴用户头像 */}
      <div
        className="header-user-section"
        style={{
          position: 'absolute',
          right: '26px',
          display: 'flex',
          alignItems: 'center',
          gap: '0px', // 消除间距，使文档链接紧贴用户头像
        }}
      >
        {/* 文档链接 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LinkButton
            to="/todo-for-ai/pages/mcp-installation"
            type="text"
            icon={<AppstoreOutlined />}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: location.pathname === '/todo-for-ai/pages/mcp-installation' ? '#1890ff' : '#666',
              fontWeight: location.pathname === '/todo-for-ai/pages/mcp-installation' ? 500 : 400,
            }}
          >
            {tn('menu.mcpDocs')}
          </LinkButton>

          <LinkButton
            to="/todo-for-ai/pages/api-documentation"
            type="text"
            icon={<ApiOutlined />}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: location.pathname === '/todo-for-ai/pages/api-documentation' ? '#1890ff' : '#666',
              fontWeight: location.pathname === '/todo-for-ai/pages/api-documentation' ? 500 : 400,
            }}
          >
            {tn('menu.apiDocs')}
          </LinkButton>
        </div>

        <UserAvatar onPinUpdate={reloadPinnedProjects} />
      </div>
    </Header>
  )
}

export default TopNavigation
