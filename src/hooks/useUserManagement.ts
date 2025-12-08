import { useState, useEffect, useCallback, useRef } from 'react'
import { message } from 'antd'
import AuthAPI, { type UserListParams } from '../api/auth'
import { useAuthStore, type User } from '../stores/useAuthStore'
import { useTranslation } from '../i18n/hooks/useTranslation'

interface UserStats {
  total: number
  active: number
  suspended: number
  admins: number
}

interface UserManagementReturn {
  users: User[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  filters: UserListParams
  stats: UserStats
  currentUserId: string | null
  loadUsers: (params?: Partial<UserListParams>) => Promise<void>
  handleSearch: (value: string) => void
  handleStatusFilter: (status: string | undefined) => void
  handleRoleFilter: (role: string | undefined) => void
  handleUpdateUserStatus: (userId: number, status: 'active' | 'suspended') => Promise<void>
  setPagination: React.Dispatch<React.SetStateAction<{
    current: number
    pageSize: number
    total: number
  }>>
}

const USER_MANAGEMENT_PAGE_SIZE_KEY = 'userManagement.pageSize'

export const useUserManagement = (): UserManagementReturn => {
  const { t } = useTranslation('userManagement')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  
  // 从LocalStorage读取上次选择的页码大小
  const getSavedPageSize = () => {
    const saved = localStorage.getItem(USER_MANAGEMENT_PAGE_SIZE_KEY)
    return saved ? parseInt(saved, 10) : 20
  }
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: getSavedPageSize(),
    total: 0
  })
  const [filters, setFilters] = useState<UserListParams>({
    search: '',
    status: undefined,
    role: undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    suspended: 0,
    admins: 0
  })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const isInitialLoad = useRef(true)
  
  // 保存pageSize到LocalStorage
  useEffect(() => {
    localStorage.setItem(USER_MANAGEMENT_PAGE_SIZE_KEY, String(pagination.pageSize))
  }, [pagination.pageSize])

  useEffect(() => {
    const currentUser = useAuthStore.getState().user
    setCurrentUserId(currentUser?.id?.toString() || null)
  }, [])

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
      const data = response
      setUsers(data.users)
      if (data.pagination.total !== pagination.total) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total
        }))
      }
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
  }, [filters, pagination.current, pagination.pageSize, t])

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      loadUsers()
    }
  }, [])

  useEffect(() => {
    if (!isInitialLoad.current && (pagination.current > 1 || pagination.pageSize !== 20)) {
      loadUsers()
    }
  }, [pagination.current, pagination.pageSize, loadUsers])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ search: value })
  }

  const handleStatusFilter = (status: string | undefined) => {
    setFilters(prev => ({ ...prev, status }))
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ status })
  }

  const handleRoleFilter = (role: string | undefined) => {
    setFilters(prev => ({ ...prev, role }))
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ role })
  }

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

  return {
    users,
    loading,
    pagination,
    filters,
    stats,
    currentUserId,
    loadUsers,
    handleSearch,
    handleStatusFilter,
    handleRoleFilter,
    handleUpdateUserStatus,
    setPagination
  }
}
