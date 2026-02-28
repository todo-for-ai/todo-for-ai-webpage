import React from 'react'
import { Form, Input, Select, DatePicker, InputNumber, Button } from 'antd'
import type { TaskFormData } from './hooks/useTaskCreation'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

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
  const { tp } = usePageTranslation('createTask')

  return (
    <Form layout="vertical" onFinish={onSubmit}>
      <Form.Item label={tp('form.simple.title.label')} required>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={tp('form.simple.title.placeholder')}
        />
      </Form.Item>

      <Form.Item label={tp('form.simple.description.label')}>
        <Input.TextArea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          placeholder={tp('form.simple.description.placeholder')}
        />
      </Form.Item>

      <Form.Item label={tp('form.settings.priority.label')}>
        <Select
          value={formData.priority}
          onChange={(value) => setFormData({ ...formData, priority: value })}
        >
          <Select.Option value="low">{tp('form.settings.priority.low')}</Select.Option>
          <Select.Option value="medium">{tp('form.settings.priority.medium')}</Select.Option>
          <Select.Option value="high">{tp('form.settings.priority.high')}</Select.Option>
          <Select.Option value="urgent">{tp('form.settings.priority.urgent')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label={tp('form.settings.dueDate.label')}>
        <DatePicker
          value={formData.due_date ? new Date(formData.due_date) : null}
          onChange={(date) => setFormData({
            ...formData,
            due_date: date ? date.toISOString().split('T')[0] : ''
          })}
        />
      </Form.Item>

      <Form.Item label={tp('form.simple.estimatedHours.label')}>
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
          {tp('actions.createMode.create')}
        </Button>
      </Form.Item>
    </Form>
  )
}

export default TaskFormSection
