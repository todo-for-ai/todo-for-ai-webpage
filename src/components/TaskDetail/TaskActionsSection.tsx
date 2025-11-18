import React from 'react'
import { Card, Button, Space, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

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
  return (
    <Card>
      <Space>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          编辑
        </Button>

        <Popconfirm
          title="确定要删除这个任务吗？"
          onConfirm={onDelete}
          okText="确定"
          cancelText="取消"
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            删除
          </Button>
        </Popconfirm>
      </Space>
    </Card>
  )
}

export default TaskActionsSection
