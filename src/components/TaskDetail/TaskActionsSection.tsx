import React from 'react'
import { Card, Button, Space, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface TaskActionsSectionProps {
  onEdit: () => void
  onDelete: () => void
  loading: boolean
}

const TaskActionsSection: React.FC<TaskActionsSectionProps> = ({
  onEdit,
  onDelete,
  loading
}) => {
  const { tp } = usePageTranslation('taskDetail')
  return (
    <Card>
      <Space>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          {tp('actions.edit')}
        </Button>

        <Popconfirm
          title={tp('confirmations.deleteTitle')}
          onConfirm={onDelete}
          okText={tp('confirmations.confirmText')}
          cancelText={tp('confirmations.cancelText')}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            {tp('actions.delete')}
          </Button>
        </Popconfirm>
      </Space>
    </Card>
  )
}

export default TaskActionsSection
