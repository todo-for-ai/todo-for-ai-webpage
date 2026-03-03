import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Layout, Menu, Typography, Badge } from 'antd'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  DashboardOutlined,
  ProjectOutlined,
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
  const loadTaskCounts = useCallback(async () => {
    try {
      const response = await pinsApi.getPinnedProjectsTaskCounts()
      const data = response
      if (data && data.task_counts) {
        setTaskCounts(data.task_counts)
      } else {
        setTaskCounts([])
      }
    } catch (error) {
      console.error('Failed to load task counts:', error)
      setTaskCounts([])
    }
  }, [])
  const loadPinnedProjects = useCallback(async () => {
    try {
      console.log('开始加载Pin项目...')
      const response = await pinsApi.getUserPins()
      console.log('Pin API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', response ? Object.keys(response) : 'null')
      const data = response
      if (data && data.pins) {
        console.log('Pin projects:', data.pins)
        data.pins.forEach((pin, index) => {
          console.log(`Pin ${index}:`, pin)
          console.log(`Pin ${index} project:`, pin.project)
        })
        const sortedPins = data.pins.sort((a: any, b: any) => (a.pin_order || 0) - (b.pin_order || 0))
        setPinnedProjects(sortedPins)
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
  }, [loadTaskCounts])
  useEffect(() => {
    loadPinnedProjects()
    const handlePinUpdate = () => {
      loadPinnedProjects()
    }
    window.addEventListener('pinUpdated', handlePinUpdate)
    return () => {
      window.removeEventListener('pinUpdated', handlePinUpdate)
    }
  }, [])
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (pinnedProjects.length > 0) {
      loadTaskCounts()
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
  const getProjectTaskCount = (projectId: number): number => {
    const taskCount = taskCounts.find(tc => tc.project_id === projectId)
    return taskCount?.pending_tasks || 0
  }
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
    ...pinnedProjects.map(pin => {
      const projectId = pin.project?.id || pin.project_id
      const taskCount = getProjectTaskCount(projectId)
      const projectColor = pin.project?.color || '#1890ff'
      return {
        key: `/todo-for-ai/pages/projects/${projectId}`,
        icon: <PushpinOutlined style={{ color: projectColor }} />,
        label: (
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              lineHeight: '1.2'
            }}
          >
            <span style={{ position: 'relative', display: 'inline-block' }}>
              {pin.project?.name || tn('menu.pinnedProject', { projectId: pin.project_id })}
              {taskCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '100%',
                    transform: 'translate(-50%, -50%)',
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
          </span>
        ),
      }
    })
  ]
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }
  useEffect(() => {
    const detectTaskProjectId = async () => {
      const pathname = location.pathname
      const taskDetailMatch = pathname.match(/^\/todo-for-ai\/pages\/tasks\/(\d+)$/)
      const taskEditMatch = pathname.match(/^\/todo-for-ai\/pages\/tasks\/(\d+)\/edit$/)
      const taskCreateMatch = pathname.match(/^\/todo-for-ai\/pages\/tasks\/create$/)
      if (taskDetailMatch || taskEditMatch) {
        const taskId = parseInt(taskDetailMatch?.[1] || taskEditMatch?.[1] || '0', 10)
        if (taskId) {
          try {
            const response = await tasksApi.getTask(taskId)
            if (response && (response as any).project_id) {
              setCurrentTaskProjectId((response as any).project_id)
            } else {
              setCurrentTaskProjectId(null)
            }
          } catch (error) {
            console.error('Failed to get task project ID:', error)
            setCurrentTaskProjectId(null)
          }
        }
      } else if (taskCreateMatch) {
        const projectIdParam = searchParams.get('project_id')
        if (projectIdParam) {
          setCurrentTaskProjectId(parseInt(projectIdParam, 10))
        } else {
          setCurrentTaskProjectId(null)
        }
      } else {
        setCurrentTaskProjectId(null)
      }
    }
    detectTaskProjectId()
  }, [location.pathname, searchParams])
  const getSelectedKeys = () => {
    if (currentTaskProjectId) {
      const pinnedProject = pinnedProjects.find(pin =>
        pin.project_id === currentTaskProjectId || pin.project?.id === currentTaskProjectId
      )
      if (pinnedProject) {
        return [`/todo-for-ai/pages/projects/${currentTaskProjectId}`]
      }
    }
    return [location.pathname]
  }
  const reloadPinnedProjects = useCallback(async () => {
    await loadPinnedProjects()
  }, [])
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
          {/*
            HTTP API文档菜单 - 暂时隐藏
            注意：这只是暂时将这个功能下线，以后还会再上线的
            当需要重新启用时，取消下面代码的注释即可
          */}
          {/*
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
          */}
        </div>
        <UserAvatar onPinUpdate={reloadPinnedProjects} />
      </div>
    </Header>
  )
}
export default TopNavigation
