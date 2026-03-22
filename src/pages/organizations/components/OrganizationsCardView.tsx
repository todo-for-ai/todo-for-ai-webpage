import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Empty, Row, Space, Tag, Tooltip, Typography } from 'antd'
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
          {(() => {
            const roleKeys = getRoleKeys(org)
            const visibleRoleKeys = roleKeys.slice(0, 2)
            const hiddenRoleCount = Math.max(roleKeys.length - visibleRoleKeys.length, 0)
            const statusText = translateStatusLabel(tp, org.status)
            const stats = getOrganizationStatItems(tp, org)
            const primaryActivityAt = org.last_activity_at || org.updated_at
            const timelineItems = [
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
              <Card
                className="flat-card"
                hoverable
                bodyStyle={{ padding: 18, height: '100%' }}
                style={{
                  height: '100%',
                  borderRadius: 8,
                  border: '1px solid #e6f4ff',
                  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
                  background: 'linear-gradient(180deg, #ffffff 0%, #fafcff 100%)',
                }}
                onClick={(event) => {
                  const target = event.target as HTMLElement
                  if (target.closest('a')) {
                    return
                  }
                  onOpenOrganization(org.id)
                }}
              >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <Space align="start" size={12}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          minWidth: 46,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'inset 0 0 0 1px rgba(24, 144, 255, 0.12)',
                        }}
                      >
                        <TeamOutlined style={{ color: '#1677ff', fontSize: 22 }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <LinkButton
                          to={`/todo-for-ai/pages/organizations/${org.id}`}
                          type="link"
                          style={{
                            padding: 0,
                            fontSize: 16,
                            fontWeight: 600,
                            height: 'auto',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={org.name}
                        >
                          {org.name}
                        </LinkButton>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            #{org.id} · {org.slug || '-'}
                          </Text>
                        </div>
                      </div>
                    </Space>
                    <Tag
                      color={statusColorMap[org.status] || 'default'}
                      style={{ marginInlineEnd: 0, paddingInline: 10 }}
                    >
                      {statusText}
                    </Tag>
                  </div>

                  <Paragraph
                    ellipsis={{ rows: 2, tooltip: org.description || undefined }}
                    style={{
                      marginBottom: 0,
                      minHeight: 44,
                      color: '#595959',
                      lineHeight: 1.6,
                    }}
                  >
                    {org.description?.trim() || tp('detail.noDescription')}
                  </Paragraph>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(24, 144, 255, 0.04)',
                      border: '1px solid rgba(24, 144, 255, 0.08)',
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {tp('table.role')}
                      </Text>
                    </div>
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
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 12,
                    }}
                  >
                    {stats.map((stat) => (
                      <div
                        key={stat.key}
                        style={{
                          borderRadius: 8,
                          padding: '12px 14px',
                          background: stat.tint,
                          border: '1px solid rgba(24, 144, 255, 0.08)',
                        }}
                      >
                        <Space size={8} align="center">
                          {stat.icon}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {stat.label}
                          </Text>
                        </Space>
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 24,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: '#1f1f1f',
                          }}
                        >
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 14,
                      borderTop: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {timelineItems.map((item) => (
                        <Tooltip key={item.key} title={formatFullDateTime(item.value)}>
                          <Space size={8}>
                            {item.icon}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.label} · {formatRelativeTimeI18n(item.value, tp)}
                            </Text>
                          </Space>
                        </Tooltip>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: 12,
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <LinkButton
                        to={`/todo-for-ai/pages/organizations/${org.id}`}
                        type="link"
                        icon={<ArrowRightOutlined />}
                        style={{ paddingInline: 0, fontWeight: 500 }}
                      >
                        {tp('actions.view')}
                      </LinkButton>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })()}
        </Col>
      ))}
    </Row>
  )
}
