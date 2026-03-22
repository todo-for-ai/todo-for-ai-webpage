/**
 * 个人资料编辑表单组件
 */

import { Card, Form, Input, Button, Space, Row, Col } from 'antd'
import { EditOutlined, SaveOutlined } from '@ant-design/icons'
import type { FormInstance } from 'antd'
import type { ProfileFormValues } from '../types'

interface ProfileEditFormProps {
  form: FormInstance
  isEditing: boolean
  isProfileSaving: boolean
  tp: (key: string, options?: Record<string, unknown>) => string
  onEditToggle: () => void
  onSubmit: (values: ProfileFormValues) => void
  onCancel: () => void
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  form,
  isEditing,
  isProfileSaving,
  tp,
  onEditToggle,
  onSubmit,
  onCancel,
}) => {
  return (
    <Card
      title={tp('basicInfo.title')}
      extra={
        <Button
          type={isEditing ? 'primary' : 'default'}
          icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
          onClick={onEditToggle}
          loading={isProfileSaving}
        >
          {isEditing ? tp('buttons.save') : tp('buttons.edit')}
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        disabled={!isEditing}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={tp('basicInfo.username')}
              name="username"
              rules={[
                { required: true, message: tp('basicInfo.validation.usernameRequired') },
                { min: 2, message: tp('basicInfo.validation.usernameMinLength') },
              ]}
            >
              <Input placeholder={tp('basicInfo.placeholders.username')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={tp('basicInfo.nickname')}
              name="nickname"
            >
              <Input placeholder={tp('basicInfo.placeholders.nickname')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={tp('basicInfo.fullName')}
          name="full_name"
        >
          <Input placeholder={tp('basicInfo.placeholders.fullName')} />
        </Form.Item>

        <Form.Item
          label={tp('basicInfo.bio')}
          name="bio"
        >
          <Input.TextArea
            rows={4}
            placeholder={tp('basicInfo.placeholders.bio')}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={tp('basicInfo.timezone')}
              name="timezone"
            >
              <Input placeholder={tp('basicInfo.placeholders.timezone')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={tp('basicInfo.language')}
              name="locale"
            >
              <Input placeholder={tp('basicInfo.placeholders.language')} />
            </Form.Item>
          </Col>
        </Row>

        {isEditing && (
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isProfileSaving}>
                {tp('buttons.saveChanges')}
              </Button>
              <Button onClick={onCancel}>
                {tp('buttons.cancel')}
              </Button>
            </Space>
          </Form.Item>
        )}
      </Form>
    </Card>
  )
}
