import React from 'react'
import { Button, Space, Tag, Popconfirm } from 'antd'
import { EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import type { ContextRule } from '../../api/contextRules'

interface ContextRulesColumnsProps {
  onDelete: (rule: ContextRule) => Promise<void>
  onToggle: (rule: ContextRule) => Promise<void>
}

export const useContextRulesColumns = ({ onDelete, onToggle }: ContextRulesColumnsProps) => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('projectDetail')

  const handleEdit = (rule: ContextRule) => {
    navigate(`/todo-for-ai/pages/context-rules/${rule.id}/edit`)
  }

  const columns = [
    {
      title: tp('contextRules.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ContextRule) => (
        <Button
          type="link"
          onClick={() => handleEdit(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: tp('contextRules.table.columns.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? tp('contextRules.status.enabled') : tp('contextRules.status.disabled')}
        </Tag>
      ),
    },
    {
      title: tp('contextRules.table.columns.actions'),
      key: 'actions',
      width: 150,
      render: (record: ContextRule) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {tp('contextRules.actions.edit')}
          </Button>
          <Popconfirm
            title={tp('contextRules.confirm.deleteTitle')}
            onConfirm={() => onDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return columns
}
