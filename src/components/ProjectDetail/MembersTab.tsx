import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Modal, Select, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { agentsApi } from '../../api/agents'

interface MemberItem {
  id: number
  project_id: number
  user_id: number
  role: string
  invited_by?: number
  accepted_at?: string
  user_email?: string
  user_name?: string
  created_at: string
  updated_at: string
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'gold',
  admin: 'red',
  member: 'blue',
  viewer: 'default',
}

const MembersTab: React.FC<{ projectId: number }> = ({ projectId }) => {
  const [members, setMembers] = useState<MemberItem[]>([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addUserId, setAddUserId] = useState<number | null>(null)
  const [addRole, setAddRole] = useState<string>('member')
  const [adding, setAdding] = useState(false)

  const loadMembers = async () => {
    setLoading(true)
    try {
      const result = await agentsApi.getProjectMembers(projectId)
      setMembers(result)
    } catch {
      message.error('加载成员列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [projectId])

  const handleAdd = async () => {
    if (!addUserId) {
      message.warning('请选择用户')
      return
    }
    setAdding(true)
    try {
      await agentsApi.addProjectMember(projectId, {
        user_id: addUserId,
        role: addRole,
      })
      message.success('成员添加成功')
      setAddOpen(false)
      setAddUserId(null)
      setAddRole('member')
      loadMembers()
    } catch (e: any) {
      message.error(e?.message || '添加失败')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (memberId: number) => {
    try {
      await agentsApi.removeProjectMember(projectId, memberId)
      message.success('成员已移除')
      loadMembers()
    } catch {
      message.error('移除失败')
    }
  }

  const handleRoleChange = async (memberId: number, newRole: string) => {
    try {
      await agentsApi.updateProjectMember(projectId, memberId, { role: newRole })
      message.success('角色已更新')
      loadMembers()
    } catch {
      message.error('更新失败')
    }
  }

  const columns = [
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string, record: MemberItem) => (
        <Space>
          <UserOutlined />
          <span>{text || record.user_email}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'user_email',
      key: 'user_email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: MemberItem) => (
        role === 'owner' ? (
          <Tag color={ROLE_COLORS[role]}>{role}</Tag>
        ) : (
          <Select
            size="small"
            value={role}
            onChange={(v) => handleRoleChange(record.id, v)}
            style={{ width: 100 }}
            options={[
              { value: 'admin', label: '管理员' },
              { value: 'member', label: '成员' },
              { value: 'viewer', label: '观察者' },
            ]}
          />
        )
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'accepted_at',
      key: 'accepted_at',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MemberItem) => (
        record.role !== 'owner' ? (
          <Popconfirm title="确定移除此成员？" onConfirm={() => handleRemove(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>移除</Button>
          </Popconfirm>
        ) : null
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#8c8c8c' }}>
          管理项目成员和角色权限。OWNER 可管理所有设置，ADMIN 可管理成员和任务，MEMBER 可编辑任务，VIEWER 只可查看。
        </span>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          添加成员
        </Button>
      </div>

      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
      />

      <Modal
        title="添加项目成员"
        open={addOpen}
        onCancel={() => { setAddOpen(false); setAddUserId(null) }}
        onOk={handleAdd}
        confirmLoading={adding}
        okText="添加"
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            style={{ width: '100%' }}
            placeholder="选择用户 ID"
            value={addUserId || undefined}
            onChange={(v) => setAddUserId(v)}
          >
            {/* User ID input - in a real app this would be a user search */}
            <Select.Option value={0}>输入用户 ID（见下方）</Select.Option>
          </Select>
          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              placeholder="输入用户 ID"
              value={addUserId || ''}
              onChange={(e) => setAddUserId(parseInt(e.target.value) || null)}
              style={{ width: '100%', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4 }}
            />
          </div>
        </div>
        <div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择角色"
            value={addRole}
            onChange={(v) => setAddRole(v)}
            options={[
              { value: 'admin', label: '管理员 (ADMIN)' },
              { value: 'member', label: '成员 (MEMBER)' },
              { value: 'viewer', label: '观察者 (VIEWER)' },
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}

export default MembersTab
