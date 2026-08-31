import { useState } from 'react'
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { useStorageConfigs } from './hooks/useStorageConfigs'
import { StorageConfigList } from './components/StorageConfigList'
import { StorageConfigForm } from './components/StorageConfigForm'
import type {
  StorageConfig,
  StorageProvider,
  CreateStorageConfigRequest,
  UpdateStorageConfigRequest,
} from '../../api/storage/types'

const { Title, Paragraph } = Typography

// Note: message is handled by the hook, not needed here

type ViewMode = 'list' | 'create' | 'edit'

export default function StorageConfigPage() {
  const { tc } = useTranslation()
  const navigate = useNavigate()
  const { workspaceId: workspaceIdParam } = useParams<{ workspaceId: string }>()
  const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam, 10) : null

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentConfig, setCurrentConfig] = useState<StorageConfig | null>(null)

  const {
    configs,
    loading,
    activeConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    setActive,
  } = useStorageConfigs(workspaceId)

  const handleCreate = () => {
    setCurrentConfig(null)
    setViewMode('create')
  }

  const handleEdit = (config: StorageConfig) => {
    if (config) {
      setCurrentConfig(config)
      setViewMode('edit')
    }
  }

  const handleDelete = async (configId: number) => {
    if (!configId) return
    await deleteConfig(configId)
  }

  const handleSetActive = async (configId: number) => {
    if (!configId) return
    await setActive(configId)
  }

  const handleCancel = () => {
    setViewMode('list')
    setCurrentConfig(null)
  }

  const handleSubmit = async (values: {
    provider: StorageProvider
    is_active: boolean
    local_base_path?: string
    local_base_url?: string
    access_key_id?: string
    access_key_secret?: string
    bucket_name?: string
    region?: string
    endpoint?: string
    custom_domain?: string
  }) => {
    if (viewMode === 'create') {
      const created = await createConfig(values as CreateStorageConfigRequest)
      if (created) {
        setViewMode('list')
      }
    } else if (viewMode === 'edit' && currentConfig) {
      const updated = await updateConfig(currentConfig.id, values as UpdateStorageConfigRequest)
      if (updated) {
        setViewMode('list')
        setCurrentConfig(null)
      }
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/todo-for-ai/pages/agents')}
              style={{ marginBottom: 16 }}
            >
              {tc('actions.back')}
            </Button>
            <Title level={2} style={{ marginBottom: 8 }}>
              {tc('storage:page.title')}
            </Title>
            <Paragraph style={{ marginBottom: 0, color: '#666' }}>
              {tc('storage:page.description')}
            </Paragraph>
          </div>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title level={4}>
                  <DatabaseOutlined style={{ marginRight: 8 }} />
                  {tc('storage:info.local.title')}
                </Title>
                <Paragraph>
                  {tc('storage:info.local.description')}
                </Paragraph>
              </div>

              <div>
                <Title level={4}>
                  <CloudOutlined style={{ marginRight: 8 }} />
                  {tc('storage:info.cloud.title')}
                </Title>
                <Paragraph>
                  {tc('storage:info.cloud.description')}
                </Paragraph>
                <ul style={{ color: '#666', fontSize: 14 }}>
                  <li>{tc('storage:info.cloud.oss')}</li>
                  <li>{tc('storage:info.cloud.cos')}</li>
                  <li>{tc('storage:info.cloud.s3')}</li>
                </ul>
              </div>

              <div>
                <Title level={4}>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  {tc('storage:info.active.title')}
                </Title>
                <Paragraph>
                  {tc('storage:info.active.description')}
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {viewMode === 'list' && (
            <StorageConfigList
              configs={configs}
              loading={loading}
              activeConfig={activeConfig}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetActive={handleSetActive}
            />
          )}

          {(viewMode === 'create' || viewMode === 'edit') && (
            <StorageConfigForm
              mode={viewMode}
              workspaceId={workspaceId || 0}
              config={currentConfig}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
        </Col>
      </Row>
    </div>
  )
}
