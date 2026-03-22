import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import {
  organizationsApi,
  type Organization,
  type OrganizationRoleDefinition,
} from '../api/organizations'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Paragraph } = Typography

interface RoleFormValues {
  title: string
  description?: string
  content?: string
}

const OrganizationRoles = () => {
  const { tp } = usePageTranslation('organizations')
  const tpRef = useRef(tp)
  const navigate = useNavigate()
  const { organizationId } = useParams()
  const parsedOrganizationId = Number(organizationId)

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [roles, setRoles] = useState<OrganizationRoleDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm<RoleFormValues>()

  useEffect(() => {
    tpRef.current = tp
  }, [tp])

  const canManage = useMemo(
    () => organization?.current_user_role === 'owner' || organization?.current_user_role === 'admin',
    [organization]
  )

  const loadData = useCallback(async () => {
    if (!parsedOrganizationId || Number.isNaN(parsedOrganizationId)) {
      message.error('Invalid organization id')
      navigate('/todo-for-ai/pages/organizations')
      return
    }

    try {
      setLoading(true)
      const [orgData, rolesData] = await Promise.all([
        organizationsApi.getOrganization(parsedOrganizationId),
        organizationsApi.getOrganizationRoles(parsedOrganizationId),
      ])
      setOrganization(orgData)
      setRoles(rolesData.items || [])
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.roleLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [navigate, parsedOrganizationId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const createRole = async () => {
    if (!parsedOrganizationId || Number.isNaN(parsedOrganizationId) || !canManage) {
      return
    }
    try {
      const values = await form.validateFields()
      setCreating(true)
      await organizationsApi.createOrganizationRole(parsedOrganizationId, {
        title: values.title.trim(),
        description: (values.description || '').trim() || undefined,
        content: (values.content || '').trim() || undefined,
      })
      message.success(tp('messages.roleCreateSuccess'))
      form.resetFields()
      await loadData()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('messages.roleCreateFailed'))
    } finally {
      setCreating(false)
    }
  }

  const deleteRole = async (roleId: number) => {
    if (!parsedOrganizationId || Number.isNaN(parsedOrganizationId) || !canManage) {
      return
    }
    try {
      setLoading(true)
      await organizationsApi.deleteOrganizationRole(parsedOrganizationId, roleId)
      message.success(tp('messages.roleDeleteSuccess'))
      await loadData()
    } catch (error: any) {
      message.error(error?.message || tp('messages.roleDeleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space direction="vertical" size={8}>
          <Button
            className="flat-btn"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/todo-for-ai/pages/organizations')}
          >
            {tp('roles.backToOrganizations')}
          </Button>
          <div>
            <Title level={2} className="page-title">
              {tp('roles.manageTitle')}
            </Title>
            <Paragraph className="page-description">
              {organization ? `${organization.name}` : ''}
            </Paragraph>
          </div>
        </Space>
      </div>

      {canManage && (
        <Card className="flat-card" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
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
              <Input.TextArea rows={5} placeholder={tp('roles.contentPlaceholder')} />
            </Form.Item>
            <Button type="primary" className="flat-btn" icon={<PlusOutlined />} loading={creating} onClick={createRole}>
              {tp('roles.create')}
            </Button>
          </Form>
        </Card>
      )}

      <Card className="flat-card">
        <Table<OrganizationRoleDefinition>
          className="flat-table"
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
                return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact
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
                    onConfirm={() => deleteRole(role.id)}
                    okText={tp('members.confirmOk')}
                    cancelText={tp('members.confirmCancel')}
                  >
                    <Button className="flat-btn" danger size="small" icon={<DeleteOutlined />}>
                      {tp('members.remove')}
                    </Button>
                  </Popconfirm>
                )
              },
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default OrganizationRoles
