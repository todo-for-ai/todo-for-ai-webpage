import React from 'react'
import { Form, Input, Checkbox, Col } from 'antd'
import ProjectSelector from '../../components/ProjectSelector'

interface TaskFormBasicInfoProps {
  tp: (key: string) => string
}

export const TaskFormBasicInfo: React.FC<TaskFormBasicInfoProps> = ({ tp }) => {
  return (
    <>
      <Form.Item
        label={tp('form.project.label')}
        name="project_id"
        rules={[{ required: true, message: tp('form.project.required') }]}
      >
        <ProjectSelector
          placeholder={tp('form.project.placeholder')}
          showSearch
          allowClear={false}
          simpleMode
        />
      </Form.Item>

      <Form.Item
        label={tp('form.title.label')}
        name="title"
        tooltip={tp('form.title.tooltip')}
      >
        <Input placeholder={tp('form.title.placeholder')} />
      </Form.Item>

      <Form.Item name="is_ai_task" valuePropName="checked">
        <Checkbox>{tp('form.assignToAI')}</Checkbox>
      </Form.Item>
    </>
  )
}
