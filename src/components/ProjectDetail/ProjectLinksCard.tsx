import React from 'react'
import { Card, Row, Col } from 'antd'
import { GithubOutlined, DesktopOutlined, CloudOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface ProjectLinksCardProps {
  project: any
}

export const ProjectLinksCard: React.FC<ProjectLinksCardProps> = ({ project }) => {
  const { tp } = usePageTranslation('projectDetail')

  const LinkItem = ({ icon, label, url, actionLabel }: any) => (
    <div style={{ marginBottom: '16px' }}>
      <strong>{label}：</strong>
      {url ? (
        <div style={{ marginTop: '4px' }}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: 0 }}>
            {icon}
            {actionLabel}
          </a>
        </div>
      ) : (
        <span style={{ color: '#999' }}> {tp('overview.projectLinks.notSet')}</span>
      )}
    </div>
  )

  return (
    <Card title={tp('overview.projectLinks.title')}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <LinkItem
            icon={<GithubOutlined style={{ marginRight: '4px' }} />}
            label={tp('overview.projectLinks.githubRepo')}
            url={project.github_url}
            actionLabel={tp('overview.projectLinks.viewRepo')}
          />
        </Col>
        <Col span={8}>
          <LinkItem
            icon={<DesktopOutlined style={{ marginRight: '4px' }} />}
            label={tp('overview.projectLinks.localEnv')}
            url={project.local_url}
            actionLabel={tp('overview.projectLinks.visitLocal')}
          />
        </Col>
        <Col span={8}>
          <LinkItem
            icon={<CloudOutlined style={{ marginRight: '4px' }} />}
            label={tp('overview.projectLinks.productionEnv')}
            url={project.production_url}
            actionLabel={tp('overview.projectLinks.visitOnline')}
          />
        </Col>
      </Row>
    </Card>
  )
}
