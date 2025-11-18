import React from 'react'
import { Form, Input, Card } from 'antd'

const { TextArea } = Input

interface BasicInfoFormProps {
  form: any
  tp: (key: string) => string
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ form, tp }) => {
  return (
    <Card title={tp('form.sections.basicInfo')}>
      <Form.Item
        label={tp('form.fields.name.label')}
        name="name"
        rules={[
          { required: true, message: tp('form.fields.name.required') },
          { max: 255, message: tp('form.fields.name.maxLength') }
        ]}
      >
        <Input placeholder={tp('form.fields.name.placeholder')} />
      </Form.Item>
      <Form.Item label={tp('form.fields.description.label')} name="description">
        <TextArea
          placeholder={tp('form.fields.description.placeholder')}
          rows={3}
          maxLength={500}
          showCount
        />
      </Form.Item>
    </Card>
  )
}

export default BasicInfoForm
