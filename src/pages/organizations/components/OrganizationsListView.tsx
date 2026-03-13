import { Space, Table, Tag, Typography } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import type { Organization } from '../../../api/organizations'
import { LinkButton } from '../../../components/SmartLink'

const { Text } = Typography

interface OrganizationsListViewProps {
  tp: (key: string, options?: Record<string, unknown>) => string
  orgs: Organization[]
  loading: boolean
  onOpenOrganization: (organizationId: number) => void
}

export function OrganizationsListView({
  tp,
  orgs,
  loading,
  onOpenOrganization,
}: OrganizationsListViewProps) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={orgs}
      pagination={false}
      onRow={(record) => ({
        onClick: (event) => {
          const target = event.target as HTMLElement
          if (target.closest('a')) {
            return
          }
          onOpenOrganization(record.id)
        },
      })}
      columns={[
        {
          title: tp('table.orgName'),
          key: 'name',
          render: (_: unknown, org: Organization) => (
            <Space>
              <TeamOutlined style={{ color: '#1890ff' }} />
              <div>
                <LinkButton
                  to={`/todo-for-ai/pages/organizations/${org.id}`}
                  type="link"
                  style={{ padding: 0, fontWeight: 600, height: 'auto' }}
                >
                  {org.name}
                </LinkButton>
                <Text type="secondary">{org.slug}</Text>
              </div>
            </Space>
          ),
        },
        {
          title: tp('table.role'),
          dataIndex: 'current_user_role',
          key: 'current_user_role',
          render: (value: string) => <Tag>{value || '-'}</Tag>,
        },
        {
          title: tp('table.members'),
          key: 'member_count',
          render: (_: unknown, org: Organization) => org.member_count ?? '-',
          width: 120,
        },
        {
          title: tp('table.projects'),
          key: 'project_count',
          render: (_: unknown, org: Organization) => org.project_count ?? '-',
          width: 120,
        },
      ]}
    />
  )
}
