/**
 * 工作流模板市场卡片
 *
 * 展示可用的工作流模板，点击可实例化。
 */
import { Button, Card, Col, Row, Spin, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { FC } from 'react'

interface WorkflowTemplate {
  key: string
  name: string
  description: string
  category: string
  step_count: number
}

interface WorkflowTemplatesCardProps {
  templates: WorkflowTemplate[]
  templateLoading: boolean
  onInstantiate: (key: string, name: string) => void
}

const WorkflowTemplatesCard: FC<WorkflowTemplatesCardProps> = ({
  templates,
  templateLoading,
  onInstantiate,
}) => {
  if (templates.length === 0) return null

  return (
    <Card title="工作流模板" style={{ marginBottom: 24 }} size="small" extra={<Spin spinning={templateLoading} size="small" />}>
      <Row gutter={[12, 12]}>
        {templates.map(tpl => (
          <Col key={tpl.key} xs={24} sm={12} md={8} lg={6}>
            <Card
              size="small"
              hoverable
              onClick={() => onInstantiate(tpl.key, tpl.name)}
              style={{ height: '100%' }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{tpl.name}</div>
              <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 4 }}>
                {tpl.description.length > 60 ? tpl.description.slice(0, 60) + '…' : tpl.description}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Tag color="blue" style={{ fontSize: 10 }}>{tpl.category}</Tag>
                <Tag style={{ fontSize: 10 }}>{tpl.step_count} 步骤</Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  )
}

export default WorkflowTemplatesCard