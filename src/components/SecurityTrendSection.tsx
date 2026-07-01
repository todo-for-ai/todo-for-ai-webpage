import React from 'react'
import { Typography, List, Tag, Space, Empty } from 'antd'
import type { SecurityDailyTrend, SecurityByAgent } from '../api/agents'
import MiniTrendChart from './MiniTrendChart'

const { Text } = Typography

interface SecurityTrendSectionProps {
  /** 按天趋势数据，无则不渲染趋势图 */
  trend: SecurityDailyTrend | null
  /** 按 Agent 聚合数据，无则不渲染排行 */
  byAgent: SecurityByAgent | null
  /** Agent 排行展示条数（默认 5） */
  agentRankLimit?: number
  /** 点击 Agent 名称回调（可选，用于跳转详情） */
  onAgentClick?: (agentId: number | null) => void
}

/**
 * 安全事件趋势区：按天趋势折线图 + 按 Agent 事件数排行。
 * 纯展示组件，Dashboard 与 CommandCenter 复用，避免重复实现。
 */
const SecurityTrendSection: React.FC<SecurityTrendSectionProps> = ({
  trend,
  byAgent,
  agentRankLimit = 5,
  onAgentClick,
}) => {
  const days = trend?.days || []
  const agents = byAgent?.agents || []
  const showTrend = days.length > 0
  const showRank = agents.length > 0

  if (!showTrend && !showRank) {
    return null
  }

  return (
    <>
      {showTrend && (
        <div style={{ marginBottom: 12 }}>
          <MiniTrendChart
            labels={days.map((d) => d.date.slice(5))}  // MM-DD
            series={[
              { key: 'sandbox_violation', label: '沙盒违规', color: '#cf1322', values: days.map((d) => d.sandbox_violation) },
              { key: 'conflict', label: '冲突', color: '#fa8c16', values: days.map((d) => d.conflict) },
              { key: 'audit', label: '审计', color: '#1890ff', values: days.map((d) => d.audit) },
            ]}
            height={120}
          />
        </div>
      )}
      {showRank && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>按 Agent 事件数排行：</Text>
          <List
            size="small"
            style={{ marginTop: 4 }}
            dataSource={agents.slice(0, agentRankLimit)}
            renderItem={(a) => {
              const name = a.name || (a.agent_id ? `Agent#${a.agent_id}` : '(无 Agent)')
              const clickable = !!onAgentClick && !!a.agent_id
              return (
                <List.Item style={{ padding: '4px 0' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text
                      ellipsis
                      style={{
                        maxWidth: 140,
                        color: clickable ? '#1890ff' : undefined,
                        cursor: clickable ? 'pointer' : 'default',
                      }}
                      onClick={clickable ? () => onAgentClick?.(a.agent_id) : undefined}
                    >
                      {name}
                    </Text>
                    <Space size={4} wrap>
                      <Tag>合计 {a.total}</Tag>
                      {a.sandbox_violation > 0 && <Tag color="magenta">沙盒 {a.sandbox_violation}</Tag>}
                      {a.conflict > 0 && <Tag color="volcano">冲突 {a.conflict}</Tag>}
                      {a.CRITICAL > 0 && <Tag color="red">高危 {a.CRITICAL}</Tag>}
                    </Space>
                  </Space>
                </List.Item>
              )
            }}
          />
        </div>
      )}
      {!showTrend && !showRank && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无趋势数据" style={{ margin: '8px 0' }} />
      )}
    </>
  )
}

export default SecurityTrendSection
