import { Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import type { Organization } from '../../../api/organizations'
import { LinkButton } from '../../../components/SmartLink'

const { Text } = Typography

interface OrganizationsCardViewProps {
  tp: (key: string, options?: Record<string, unknown>) => string
  orgs: Organization[]
  loading: boolean
  onOpenOrganization: (organizationId: number) => void
}

export function OrganizationsCardView({
  tp,
  orgs,
  loading,
  onOpenOrganization,
}: OrganizationsCardViewProps) {
  if (!loading && orgs.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <Row gutter={[16, 16]}>
      {orgs.map((org) => (
        <Col key={org.id} xs={24} sm={12} lg={8} xl={6}>
          <Card
            hoverable
            onClick={(event) => {
              const target = event.target as HTMLElement
              if (target.closest('a')) {
                return
              }
              onOpenOrganization(org.id)
            }}
          >
            <Space align="start">
              <TeamOutlined style={{ color: '#1890ff', fontSize: 18, marginTop: 4 }} />
              <div style={{ minWidth: 0 }}>
                <LinkButton
                  to={`/todo-for-ai/pages/organizations/${org.id}`}
                  type="link"
                  style={{
                    padding: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    height: 'auto',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={org.name}
                >
                  {org.name}
                </LinkButton>
                <Text type="secondary">{org.slug || '-'}</Text>
              </div>
            </Space>

            <div style={{ marginTop: 12 }}>
              <Tag>{org.current_user_role || '-'}</Tag>
            </div>

            <Space style={{ marginTop: 12 }} split={<span>|</span>}>
              <Text type="secondary">
                {tp('table.members')}: {org.member_count ?? '-'}
              </Text>
              <Text type="secondary">
                {tp('table.projects')}: {org.project_count ?? '-'}
              </Text>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
