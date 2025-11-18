import React from 'react'
import { Typography } from 'antd'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { AuthGuard } from '../components/AuthGuard'
import { useUserManagement } from '../hooks/useUserManagement'
import { UserStatsCards } from '../components/UserManagement/UserStatsCards'
import { UserFilters } from '../components/UserManagement/UserFilters'
import { UserTable } from '../components/UserManagement/UserTable'

const { Title } = Typography

const UserManagement: React.FC = () => {
  const { t } = useTranslation('userManagement')
  const {
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
  } = useUserManagement()

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }))
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="page-container">
        <div className="page-header">
          <Title level={2}>{t('title')}</Title>
          <p>{t('description')}</p>
        </div>

        <UserStatsCards stats={stats} tp={t} />

        <UserFilters
          filters={filters}
          loading={loading}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onRoleFilter={handleRoleFilter}
          onRefresh={loadUsers}
          tp={t}
        />

        <UserTable
          users={users}
          loading={loading}
          pagination={pagination}
          currentUserId={currentUserId}
          onUpdateUserStatus={handleUpdateUserStatus}
          onChange={handleTableChange}
          tp={t}
        />
      </div>
    </AuthGuard>
  )
}

export default UserManagement
