import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd'
import {
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CrownOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import AuthAPI, { type UserListParams } from '../api/auth'
import { useAuthStore, type User } from '../stores/useAuthStore'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { AuthGuard } from '../components/AuthGuard'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface UserStats {
  total: number
  active: number
  suspended: number
  admins: number
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('userManagement')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState<UserListParams>({
    search: '',
    status: undefined,
    role: undefined
  })
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    suspended: 0,
    admins: 0
  })

  // 使用ref来避免useEffect依赖问题
  const isInitialLoad = useRef(true)
  // 使用ref存储当前用户ID，避免重新渲染
  const currentUserIdRef = useRef<string | null>(null)

  // 只在组件挂载时获取一次当前用户ID
  useEffect(() => {
    const currentUser = useAuthStore.getState().user
    currentUserIdRef.current = currentUser?.id || null
  }, [])

  // 加载用户列表
  const loadUsers = useCallback(async (params?: Partial<UserListParams>) => {
    setLoading(true)
    try {
      const queryParams = {
        ...filters,
        ...params,
        page: params?.page || pagination.current,
        per_page: params?.per_page || pagination.pageSize
      }

      const response = await AuthAPI.getUsers(queryParams)
      const data = response.data || response // 兼容不同的响应格式
      setUsers(data.users)

      // 只在total真正变化时更新pagination，避免无限循环
      if (data.pagination.total !== pagination.total) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total
        }))
      }

      // 计算统计数据
      const newStats: UserStats = {
        total: data.pagination.total,
        active: data.users.filter(u => u.status === 'active').length,
        suspended: data.users.filter(u => u.status === 'suspended').length,
        admins: data.users.filter(u => u.role === 'admin').length
      }
      setStats(newStats)
      
    } catch (error) {
      console.error('Failed to load users:', error)
      message.error(t('messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.current, pagination.pageSize])

  // 初始加载
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      loadUsers()
    }
  }, []) // 移除loadUsers依赖，避免循环

  // 分页变化时重新加载
  useEffect(() => {
    // 只有在非初始加载且页码或页面大小改变时才重新加载
    if (!isInitialLoad.current && (pagination.current > 1 || pagination.pageSize !== 20)) {
      loadUsers()
    }
  }, [pagination.current, pagination.pageSize]) // 移除loadUsers依赖，避免循环

  // 搜索用户
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ search: value })
  }

  // 筛选状态
  const handleStatusFilter = (status: string | undefined) => {
    setFilters(prev => ({ ...prev, status }))
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ status })
  }

  // 筛选角色
  const handleRoleFilter = (role: string | undefined) => {
    setFilters(prev => ({ ...prev, role }))
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ role })
  }

  // 更新用户状态
  const handleUpdateUserStatus = async (userId: number, status: 'active' | 'suspended') => {
    try {
      await AuthAPI.updateUserStatus(userId, status)
      message.success(t('messages.statusUpdated'))
      loadUsers()
    } catch (error) {
      console.error('Failed to update user status:', error)
      message.error(t('messages.updateFailed'))
    }
  }

  // 表格列定义
  const columns = [
    {
      title: t('table.columns.user'),
      key: 'user',
      width: 250,
      render: (record: User) => (
        <Space>
          <Avatar
            src={record.avatar_url}
            icon={<UserOutlined />}
            size="default"
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.full_name || record.nickname || record.username}
              {record.role === 'admin' && (
                <CrownOutlined style={{ marginLeft: 8, color: '#faad14' }} />
              )}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: t('table.columns.role'),
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>
          {t(`roles.${role}`)}
        </Tag>
      )
    },
    {
      title: t('table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'orange'}>
          {t(`status.${status}`)}
        </Tag>
      )
    },
    {
      title: t('table.columns.lastLogin'),
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: t('table.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: t('table.columns.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: User) => {
        // 不能对自己进行操作
        if (record.id === currentUserIdRef.current) {
          return <span style={{ color: '#999' }}>{t('actions.self')}</span>
        }

        return (
          <Space size="small">
            {record.status === 'active' ? (
              <Popconfirm
                title={t('confirm.suspend')}
                description={t('confirm.suspendDescription')}
                onConfirm={() => handleUpdateUserStatus(record.id, 'suspended')}
                okText={t('confirm.ok')}
                cancelText={t('confirm.cancel')}
              >
                <Button
                  type="text"
                  danger
                  icon={<StopOutlined />}
                  size="small"
                >
                  {t('actions.suspend')}
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title={t('confirm.activate')}
                description={t('confirm.activateDescription')}
                onConfirm={() => handleUpdateUserStatus(record.id, 'active')}
                okText={t('confirm.ok')}
                cancelText={t('confirm.cancel')}
              >
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                  size="small"
                >
                  {t('actions.activate')}
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="page-container">
        <div className="page-header">
          <Title level={2}>{t('title')}</Title>
          <p>{t('description')}</p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('stats.totalUsers')}
                value={stats.total}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('stats.activeUsers')}
                value={stats.active}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('stats.suspendedUsers')}
                value={stats.suspended}
                prefix={<StopOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('stats.admins')}
                value={stats.admins}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选和搜索 */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder={t('search.placeholder')}
                allowClear
                onSearch={handleSearch}
                style={{ width: 300 }}
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col>
              <Select
                placeholder={t('filters.status')}
                allowClear
                style={{ width: 120 }}
                onChange={handleStatusFilter}
                value={filters.status}
              >
                <Option value="active">{t('status.active')}</Option>
                <Option value="suspended">{t('status.suspended')}</Option>
                <Option value="inactive">{t('status.inactive')}</Option>
              </Select>
            </Col>
            <Col>
              <Select
                placeholder={t('filters.role')}
                allowClear
                style={{ width: 120 }}
                onChange={handleRoleFilter}
                value={filters.role}
              >
                <Option value="admin">{t('roles.admin')}</Option>
                <Option value="user">{t('roles.user')}</Option>
              </Select>
            </Col>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadUsers()}
                loading={loading}
              >
                {t('actions.refresh')}
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 用户表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                t('table.pagination.total', { 
                  start: range[0], 
                  end: range[1], 
                  total 
                }),
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }))
              }
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>
    </AuthGuard>
  )
}

export default UserManagement
