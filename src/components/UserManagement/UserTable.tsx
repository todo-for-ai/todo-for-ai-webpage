import React from 'react'
import { Table, Space, Tag, Avatar, Button, Popconfirm } from 'antd'
import {
  UserOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CrownOutlined
} from '@ant-design/icons'
import type { User } from '../../stores/useAuthStore'

interface UserTableProps {
  users: User[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  currentUserId: string | null
  onUpdateUserStatus: (userId: number, status: 'active' | 'suspended') => Promise<void>
  onChange: (page: number, pageSize: number) => void
  tp: (key: string) => string
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  pagination,
  currentUserId,
  onUpdateUserStatus,
  onChange,
  tp
}) => {
  const columns = [
    {
      title: tp('table.columns.user'),
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
      title: tp('table.columns.role'),
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>
          {tp(`roles.${role}`)}
        </Tag>
      )
    },
    {
      title: tp('table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'orange'}>
          {tp(`status.${status}`)}
        </Tag>
      )
    },
    {
      title: tp('table.columns.lastLogin'),
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: tp('table.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: tp('table.columns.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: User) => {
        if (record.id.toString() === currentUserId) {
          return <span style={{ color: '#999' }}>{tp('actions.self')}</span>
        }
        return (
          <Space size="small">
            {record.status === 'active' ? (
              <Popconfirm
                title={tp('confirm.suspend')}
                description={tp('confirm.suspendDescription')}
                onConfirm={() => onUpdateUserStatus(record.id, 'suspended')}
                okText={tp('confirm.ok')}
                cancelText={tp('confirm.cancel')}
              >
                <Button
                  type="text"
                  danger
                  icon={<StopOutlined />}
                  size="small"
                >
                  {tp('actions.suspend')}
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title={tp('confirm.activate')}
                description={tp('confirm.activateDescription')}
                onConfirm={() => onUpdateUserStatus(record.id, 'active')}
                okText={tp('confirm.ok')}
                cancelText={tp('confirm.cancel')}
              >
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                  size="small"
                >
                  {tp('actions.activate')}
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      }
    }
  ]

  return (
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
            tp('table.pagination.total', {
              start: range[0],
              end: range[1],
              total
            }),
          onChange
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  )
}

export default UserTable
