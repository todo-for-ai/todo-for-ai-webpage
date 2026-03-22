import {
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Empty, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { Organization } from '../../../api/organizations'
import { LinkButton } from '../../../components/SmartLink'
import { formatFullDateTime, formatRelativeTimeI18n } from '../../../utils/dateUtils'
import {
  getOrganizationStatItems,
  getRoleKeys,
  roleColorMap,
  statusColorMap,
  translateRoleLabel,
  translateStatusLabel,
} from './organizationViewShared'

const { Paragraph, Text } = Typography

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
      className="flat-table"
      rowKey="id"
      loading={loading}
      dataSource={orgs}
      pagination={false}
      scroll={{ x: 1260 }}
      onRow={(record) => ({
        onClick: (event) => {
          const target = event.target as HTMLElement
          if (target.closest('a')) {
            return
          }
          onOpenOrganization(record.id)
        },
      })}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      columns={[
        {
          title: tp('table.orgName'),
          key: 'name',
          width: 360,
          render: (_: unknown, org: Organization) => (
            <Space align="start" size={12}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(24, 144, 255, 0.12)',
                }}
              >
                <TeamOutlined style={{ color: '#1890ff', fontSize: 18 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <Space size={[8, 8]} wrap style={{ marginBottom: 4 }}>
                  <LinkButton
                    to={`/todo-for-ai/pages/organizations/${org.id}`}
                    type="link"
                    style={{ padding: 0, fontWeight: 600, height: 'auto' }}
                  >
                    {org.name}
                  </LinkButton>
                  <Tag
                    color={statusColorMap[org.status] || 'default'}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {translateStatusLabel(tp, org.status)}
                  </Tag>
                </Space>
                <div style={{ marginBottom: 6 }}>
                  <Text type="secondary">
                    #{org.id} · {org.slug || '-'}
                  </Text>
                </div>
                <Paragraph
                  ellipsis={{ rows: 2, tooltip: org.description || undefined }}
                  style={{ marginBottom: 0, color: '#595959' }}
                >
                  {org.description?.trim() || tp('detail.noDescription')}
                </Paragraph>
              </div>
            </Space>
          ),
        },
        {
          title: tp('table.role'),
          key: 'current_user_roles',
          width: 220,
          render: (_: unknown, org: Organization) => {
            const roleKeys = getRoleKeys(org)
            const visibleRoleKeys = roleKeys.slice(0, 2)
            const hiddenRoleCount = Math.max(roleKeys.length - visibleRoleKeys.length, 0)

            return (
              <Space size={[8, 8]} wrap>
                {visibleRoleKeys.length > 0 ? (
                  visibleRoleKeys.map((roleKey) => (
                    <Tag
                      key={roleKey}
                      color={roleColorMap[roleKey] || 'default'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {translateRoleLabel(tp, roleKey)}
                    </Tag>
                  ))
                ) : (
                  <Tag style={{ marginInlineEnd: 0 }}>-</Tag>
                )}
                {hiddenRoleCount > 0 ? (
                  <Tag style={{ marginInlineEnd: 0 }}>
                    {tp('card.moreRoles', { count: hiddenRoleCount })}
                  </Tag>
                ) : null}
              </Space>
            )
          },
        },
        {
          title: tp('table.summary'),
          key: 'summary',
          width: 320,
          render: (_: unknown, org: Organization) => {
            const statItems = getOrganizationStatItems(tp, org)

            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {statItems.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      borderRadius: 8,
                      padding: '8px 10px',
                      background: item.tint,
                      border: '1px solid rgba(24, 144, 255, 0.08)',
                    }}
                  >
                    <Space size={6} align="center">
                      {item.icon}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.label}
                      </Text>
                    </Space>
                    <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )
          },
        },
        {
          title: tp('table.activity'),
          key: 'activity',
          width: 260,
          render: (_: unknown, org: Organization) => {
            const primaryActivityAt = org.last_activity_at || org.updated_at
            const activityItems = [
              {
                key: 'lastActivity',
                icon: <ClockCircleOutlined style={{ color: '#1677ff' }} />,
                label: tp('detail.stats.lastActivity'),
                value: primaryActivityAt,
              },
              ...(org.updated_at && org.updated_at !== primaryActivityAt
                ? [
                    {
                      key: 'updatedAt',
                      icon: <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
                      label: tp('detail.fields.updatedAt'),
                      value: org.updated_at,
                    },
                  ]
                : []),
              {
                key: 'createdAt',
                icon: <CalendarOutlined style={{ color: '#8c8c8c' }} />,
                label: tp('detail.fields.createdAt'),
                value: org.created_at,
              },
            ].filter((item) => item.value)

            return (
              <Space direction="vertical" size={6}>
                {activityItems.map((item) => (
                  <Tooltip key={item.key} title={formatFullDateTime(item.value)}>
                    <Space size={8}>
                      {item.icon}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.label} · {formatRelativeTimeI18n(item.value, tp)}
                      </Text>
                    </Space>
                  </Tooltip>
                ))}
              </Space>
            )
          },
        },
      ]}
    />
  )
}
