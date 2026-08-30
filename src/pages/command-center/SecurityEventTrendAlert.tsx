/**
 * 安全事件环比提示 Alert
 *
 * 展示近 N 天安全事件累计、最近一日事件数、与前日增减量。
 */
import { Alert, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import type { FC } from 'react'

const { Text } = Typography

interface SecurityEventTrendAlertProps {
  trend: { trend: Array<{ date: string; total: number }> } | null
  days?: number
}

const SecurityEventTrendAlert: FC<SecurityEventTrendAlertProps> = ({ trend, days = 7 }) => {
  if (!trend || trend.trend.length === 0) return null

  const recent = trend.trend.slice(-days)
  const total = recent.reduce((s, t) => s + t.total, 0)
  const lastDay = recent[recent.length - 1]?.total ?? 0
  const prevDay = recent.length >= 2 ? recent[recent.length - 2]?.total ?? 0 : 0
  const diff = lastDay - prevDay
  const pct = prevDay > 0 ? Math.round((diff / prevDay) * 100) : 0

  let icon = <MinusOutlined style={{ color: '#1890ff' }} />
  let color = '#1890ff'
  let changeText = '持平'
  if (diff > 0) {
    icon = <ArrowUpOutlined style={{ color: '#ff4d4f' }} />
    color = '#ff4d4f'
    changeText = `↑ ${diff} (+${pct}%)`
  } else if (diff < 0) {
    icon = <ArrowDownOutlined style={{ color: '#52c41a' }} />
    color = '#52c41a'
    changeText = `↓ ${Math.abs(diff)} (${pct}%)`
  }

  return (
    <Alert
      type="info"
      showIcon
      icon={icon}
      style={{ marginBottom: 16 }}
      message={
        <span>
          近 {days} 天累计 <Text strong>{total}</Text> 个事件，
          最近一日 <Text strong>{lastDay}</Text> 个 {` `}
          <Text style={{ color }}>{changeText}</Text>
        </span>
      }
    />
  )
}

export default SecurityEventTrendAlert