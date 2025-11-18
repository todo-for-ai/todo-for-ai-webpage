import React from 'react'
import { Card, Row, Col } from 'antd'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface ProjectBasicInfoCardProps {
  project: any
}

export const ProjectBasicInfoCard: React.FC<ProjectBasicInfoCardProps> = ({ project }) => {
  const { tp } = usePageTranslation('projectDetail')

  return (
    <Card title={tp('overview.basicInfo.title')}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div style={{ marginBottom: '16px' }}>
            <strong>{tp('overview.basicInfo.createdAt')}：</strong>
            {new Date(project.created_at).toLocaleString('zh-CN')}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>{tp('overview.basicInfo.updatedAt')}：</strong>
            {new Date(project.updated_at).toLocaleString('zh-CN')}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ marginBottom: '16px' }}>
            <strong>{tp('overview.basicInfo.projectColor')}：</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: project.color,
                  border: '1px solid #d9d9d9'
                }}
              />
              <span style={{ fontFamily: 'monospace' }}>{project.color}</span>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}
