import { Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import type { Organization } from '../../../api/organizations'

const { Text } = Typography

interface OrganizationsCardViewProps {
  tp: (key: string, options?: Record<string, unknown>) => string
  orgs: Organization[]
  loading: boolean
  selectedOrgId: number | null
  onSelectOrg: (organizationId: number) => void
}

export function OrganizationsCardView({
  tp,
  orgs,
  loading,
  selectedOrgId,
  onSelectOrg,
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
            onClick={() => onSelectOrg(org.id)}
            style={{
              borderColor: org.id === selectedOrgId ? '#1677ff' : undefined,
              boxShadow:
                org.id === selectedOrgId ? '0 0 0 2px rgba(22,119,255,0.18)' : undefined,
            }}
          >
            <Space align="start">
              <TeamOutlined style={{ color: '#1890ff', fontSize: 18, marginTop: 4 }} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={org.name}
                >
                  {org.name}
                </div>
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
