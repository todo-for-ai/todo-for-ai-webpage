import React from 'react'
import { Row, Card } from 'antd'
import { MarkdownEditor } from '../MarkdownEditor'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { ProjectBasicInfoCard } from './ProjectBasicInfoCard'
import { ProjectLinksCard } from './ProjectLinksCard'

interface ProjectInfo {
  id: number
  name: string
  description?: string
  project_context?: string
  github_url?: string
  local_url?: string
  production_url?: string
  color: string
  status: string
  created_at: string
  updated_at: string
  created_by?: string
}

interface ProjectInfoSectionProps {
  project: ProjectInfo
}

export const ProjectInfoSection: React.FC<ProjectInfoSectionProps> = ({ project }) => {
  const { tp } = usePageTranslation('projectDetail')

  return (
    <>
      {project.description && (
        <Row>
          <div style={{ width: '100%' }}>
            <MarkdownEditor
              value={project.description}
              readOnly={true}
              hideToolbar={true}
              autoHeight={true}
              preview="preview"
            />
          </div>
        </Row>
      )}
      <Row style={{ marginTop: '16px' }}>
        <div style={{ width: '100%' }}>
          <ProjectBasicInfoCard project={project} />
        </div>
      </Row>
      <Row style={{ marginTop: '16px' }}>
        <div style={{ width: '100%' }}>
          <ProjectLinksCard project={project} />
        </div>
      </Row>
      {project.project_context && (
        <Row style={{ marginTop: '16px' }}>
          <div style={{ width: '100%' }}>
            <Card style={{ marginBottom: 16 }} title={tp('overview.projectContext.title')}>
              <MarkdownEditor
                value={project.project_context}
                readOnly={true}
                hideToolbar={true}
                height={400}
              />
            </Card>
          </div>
        </Row>
      )}
    </>
  )
}
