import React from 'react'
import { Form, Input, Select, DatePicker, InputNumber, Button } from 'antd'
import type { TaskFormData } from './hooks/useTaskCreation'

interface TaskFormSectionProps {
  formData: TaskFormData
  setFormData: (data: TaskFormData) => void
  loading: boolean
  onSubmit: () => void
}

const TaskFormSection: React.FC<TaskFormSectionProps> = ({
  formData,
  setFormData,
  loading,
  onSubmit
}) => {
  return (
    <Form layout="vertical" onFinish={onSubmit}>
      <Form.Item label="任务标题" required>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="请输入任务标题"
        />
      </Form.Item>

      <Form.Item label="任务描述">
        <Input.TextArea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          placeholder="请输入任务描述"
        />
      </Form.Item>

      <Form.Item label="优先级">
        <Select
          value={formData.priority}
          onChange={(value) => setFormData({ ...formData, priority: value })}
        >
          <Select.Option value="low">低</Select.Option>
          <Select.Option value="medium">中</Select.Option>
          <Select.Option value="high">高</Select.Option>
          <Select.Option value="urgent">紧急</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="截止日期">
        <DatePicker
          value={formData.due_date ? new Date(formData.due_date) : null}
          onChange={(date) => setFormData({
            ...formData,
            due_date: date ? date.toISOString().split('T')[0] : ''
          })}
        />
      </Form.Item>

      <Form.Item label="预计工时">
        <InputNumber
          value={formData.estimated_hours}
          onChange={(value) => setFormData({ ...formData, estimated_hours: value || 0 })}
          min={0}
          max={1000}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          创建任务
        </Button>
      </Form.Item>
    </Form>
  )
}

export default TaskFormSection
