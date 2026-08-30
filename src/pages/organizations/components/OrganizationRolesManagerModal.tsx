import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag } from 'antd'
import { useState } from 'react'
import type { OrganizationRoleDefinition } from '../../../api/organizations'

interface OrganizationRolesManagerModalProps {
  tp: (key: string, options?: Record<string, unknown>) => string
  open: boolean
  loading: boolean
  canManage: boolean
  roles: OrganizationRoleDefinition[]
  onClose: () => void
  onCreateRole: (payload: { title: string; description?: string; content?: string }) => Promise<void>
  onDeleteRole: (roleId: number) => Promise<void>
}

interface RoleFormValues {
  title: string
  description?: string
  content?: string
}

export function OrganizationRolesManagerModal({
  tp,
  open,
  loading,
  canManage,
  roles,
  onClose,
  onCreateRole,
  onDeleteRole,
}: OrganizationRolesManagerModalProps) {
  const [form] = Form.useForm<RoleFormValues>()
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!canManage) {
      return
    }
    try {
      const values = await form.validateFields()
      setCreating(true)
      await onCreateRole({
        title: values.title.trim(),
        description: (values.description || '').trim() || undefined,
        content: (values.content || '').trim() || undefined,
      })
      form.resetFields()
    } catch (error: any) {
      if (!error?.errorFields) {
        throw error
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      title={tp('roles.manageTitle')}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={780}
    >
      {canManage && (
        <Form form={form} layout="vertical" style={{ marginBottom: 16 }}>
          <Form.Item
            name="title"
            label={tp('roles.form.title')}
            rules={[{ required: true, message: tp('roles.titleRequired') }]}
          >
            <Input placeholder={tp('roles.titlePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={tp('roles.form.description')}>
            <Input placeholder={tp('roles.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item name="content" label={tp('roles.form.content')}>
            <Input.TextArea rows={4} placeholder={tp('roles.contentPlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              loading={creating}
            >
              {tp('roles.create')}
            </Button>
          </Form.Item>
        </Form>
      )}

      <Table<OrganizationRoleDefinition>
        rowKey="id"
        loading={loading}
        pagination={false}
        dataSource={roles}
        columns={[
          {
            title: tp('roles.table.title'),
            key: 'name',
            render: (_, role) => (
              <Space>
                <span>{role.title || role.name}</span>
                {role.is_system ? <Tag color="blue">{tp('roles.system')}</Tag> : null}
              </Space>
            ),
          },
          {
            title: tp('roles.table.key'),
            dataIndex: 'key',
            key: 'key',
            width: 180,
          },
          {
            title: tp('roles.table.description'),
            dataIndex: 'description',
            key: 'description',
            render: (value: string | null | undefined) => value || '-',
          },
          {
            title: tp('roles.table.content'),
            dataIndex: 'content',
            key: 'content',
            render: (value: string | null | undefined) => {
              if (!value) {
                return '-'
              }
              const compact = value.replace(/\s+/g, ' ').trim()
              return compact.length > 80 ? `${compact.slice(0, 80)}...` : compact
            },
          },
          {
            title: tp('roles.table.actions'),
            key: 'actions',
            width: 120,
            render: (_, role) => {
              if (!canManage || role.is_system) {
                return null
              }
              return (
                <Popconfirm
                  title={tp('roles.deleteConfirmTitle')}
                  description={tp('roles.deleteConfirmDesc')}
                  onConfirm={() => onDeleteRole(role.id)}
                  okText={tp('members.confirmOk')}
                  cancelText={tp('members.confirmCancel')}
                >
                  <Button danger size="small" icon={<DeleteOutlined />}>
                    {tp('members.remove')}
                  </Button>
                </Popconfirm>
              )
            },
          },
        ]}
      />
    </Modal>
  )
}
