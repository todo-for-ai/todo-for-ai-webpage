import { useState } from 'react'
import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Popconfirm,
  Typography,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { StorageConfig } from '../../../api/storage/types'
import { useTranslation } from '../../../i18n/hooks/useTranslation'

const { Text } = Typography

interface StorageConfigListProps {
  configs: StorageConfig[]
  loading: boolean
  activeConfig: StorageConfig | null
  onCreate: () => void
  onEdit: (config: StorageConfig) => void
  onDelete: (configId: number) => void
  onSetActive: (configId: number) => void
}

export function StorageConfigList({
  configs,
  loading,
  activeConfig,
  onCreate,
  onEdit,
  onDelete,
  onSetActive,
}: StorageConfigListProps) {
  const { tc } = useTranslation()

  const providerLabelMap: Record<string, string> = {
    local: 'Local Storage',
    oss: 'Aliyun OSS',
    cos: 'Tencent COS',
    s3: 'AWS S3',
  }

  const providerColorMap: Record<string, string> = {
    local: 'default',
    oss: 'orange',
    cos: 'blue',
    s3: 'gold',
  }

  const columns = [
    {
      title: tc('storage:list.columns.provider'),
      key: 'provider',
      render: (_: any, config: StorageConfig) => (
        <Tag color={providerColorMap[config.provider] || 'default'}>
          {providerLabelMap[config.provider] || config.provider}
        </Tag>
      ),
    },
    {
      title: tc('storage:list.columns.status'),
      key: 'status',
      render: (_: any, config: StorageConfig) => (
        config.is_active ? (
          <Badge status="success" text={tc('storage:list.status.active')} />
        ) : (
          <Badge status="default" text={tc('storage:list.status.inactive')} />
        )
      ),
    },
    {
      title: tc('storage:list.columns.config'),
      key: 'config',
      width: 300,
      render: (_: any, config: StorageConfig) => {
        if (config.provider === 'local') {
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Path: {config.local_base_path}
              </Text>
            </div>
          )
        }
        return (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bucket: {config.bucket_name}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Region: {config.region}
            </Text>
          </div>
        )
      },
    },
    {
      title: tc('storage:list.columns.updatedAt'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: tc('storage:list.columns.actions'),
      key: 'actions',
      width: 200,
      render: (_: any, config: StorageConfig) => (
        <Space>
          {!config.is_active && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onSetActive(config.id)}
            >
              {tc('storage:list.actions.activate')}
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(config)}
          >
            {tc('storage:list.actions.edit')}
          </Button>
          <Popconfirm
            title={tc('storage:list.confirmDelete.title')}
            description={tc('storage:list.confirmDelete.description')}
            onConfirm={() => onDelete(config.id)}
            okText={tc('actions.delete')}
            cancelText={tc('actions.cancel')}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              {tc('storage:list.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title={tc('storage:list.title')}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          {tc('storage:list.actions.add')}
        </Button>
      }
    >
      {activeConfig && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text strong>{tc('storage:list.currentActive')}:</Text>
            <Tag color={providerColorMap[activeConfig.provider] || 'default'}>
              {providerLabelMap[activeConfig.provider] || activeConfig.provider}
            </Tag>
            <Text type="secondary">
              {activeConfig.provider === 'local'
                ? activeConfig.local_base_path
                : activeConfig.bucket_name}
            </Text>
          </Space>
        </div>
      )}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={configs}
        columns={columns}
        pagination={false}
      />
    </Card>
  )
}
