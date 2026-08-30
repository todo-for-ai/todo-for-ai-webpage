import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, message, Modal, Segmented, Space, Typography } from 'antd'
import { AppstoreOutlined, OrderedListOutlined, PlusOutlined } from '@ant-design/icons'
import { organizationsApi, type Organization } from '../api/organizations'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { OrganizationsCardView } from './organizations/components/OrganizationsCardView'
import { OrganizationsListView } from './organizations/components/OrganizationsListView'
import {
  loadOrganizationsViewModeFromIndexedDb,
  saveOrganizationsViewModeToIndexedDb,
  type OrganizationsViewMode,
} from './organizations/storage'

const { Title, Paragraph, Text } = Typography

const Organizations = () => {
  const { tp } = usePageTranslation('organizations')
  const navigate = useNavigate()
  const tpRef = useRef(tp)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<OrganizationsViewMode>('list')
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()

  useEffect(() => {
    tpRef.current = tp
  }, [tp])

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
      setOrgs(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    let active = true
    void loadOrganizationsViewModeFromIndexedDb().then((mode) => {
      if (active) {
        setViewMode(mode)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const createOrganization = async () => {
    try {
      const values = await createForm.validateFields()
      setLoading(true)
      await organizationsApi.createOrganization(values)
      message.success(tp('messages.createSuccess'))
      setCreateVisible(false)
      createForm.resetFields()
      await loadOrganizations()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('messages.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleViewModeChange = (mode: OrganizationsViewMode) => {
    setViewMode(mode)
    void saveOrganizationsViewModeToIndexedDb(mode)
  }

  const handleOpenOrganization = (organizationId: number) => {
    navigate(`/todo-for-ai/pages/organizations/${organizationId}`)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <Title level={2} className="page-title">{tp('title')}</Title>
            <Paragraph className="page-description">{tp('subtitle')}</Paragraph>
          </div>
          <Space>
            <Space>
              <Text type="secondary">{tp('viewMode.label')}</Text>
              <Segmented<OrganizationsViewMode>
                value={viewMode}
                onChange={(value) => handleViewModeChange(value)}
                options={[
                  {
                    value: 'list',
                    label: (
                      <Space size={6}>
                        <OrderedListOutlined />
                        {tp('viewMode.list')}
                      </Space>
                    ),
                  },
                  {
                    value: 'card',
                    label: (
                      <Space size={6}>
                        <AppstoreOutlined />
                        {tp('viewMode.card')}
                      </Space>
                    ),
                  },
                ]}
              />
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
              {tp('actions.create')}
            </Button>
          </Space>
        </div>
      </div>

      <Card>
        {viewMode === 'list' ? (
          <OrganizationsListView
            tp={tp}
            orgs={orgs}
            loading={loading}
            onOpenOrganization={handleOpenOrganization}
          />
        ) : (
          <OrganizationsCardView
            tp={tp}
            orgs={orgs}
            loading={loading}
            onOpenOrganization={handleOpenOrganization}
          />
        )}
      </Card>

      <Modal
        title={tp('createModal.title')}
        open={createVisible}
        onOk={createOrganization}
        onCancel={() => setCreateVisible(false)}
        confirmLoading={loading}
        okText={tp('createModal.confirm')}
        cancelText={tp('createModal.cancel')}
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item
            name="name"
            label={tp('createModal.name')}
            rules={[{ required: true, message: tp('createModal.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="slug" label={tp('createModal.slug')}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={tp('createModal.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Organizations
