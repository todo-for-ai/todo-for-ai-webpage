import { Badge, Tooltip } from 'antd'

interface OnlineStatusBadgeProps {
  lastActiveAt: string | null
  userName?: string
  size?: 'small' | 'default'
}

function isOnline(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  const diff = Date.now() - new Date(lastActiveAt).getTime()
  return diff < 5 * 60 * 1000 // 5 minutes
}

function getStatusText(lastActiveAt: string | null): string {
  if (!lastActiveAt) return '离线'
  const diff = Date.now() - new Date(lastActiveAt).getTime()
  if (diff < 60 * 1000) return '在线'
  if (diff < 5 * 60 * 1000) return '刚刚活跃'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前活跃`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前活跃`
  return `${Math.floor(diff / 86400000)}天前活跃`
}

export default function OnlineStatusBadge({ lastActiveAt, userName, size = 'default' }: OnlineStatusBadgeProps) {
  const online = isOnline(lastActiveAt)
  const statusText = getStatusText(lastActiveAt)

  return (
    <Tooltip title={`${userName || '用户'}: ${statusText}`}>
      <Badge status={online ? 'success' : 'default'} style={{ marginRight: 4 }} />
      {size !== 'small' && <span style={{ fontSize: 12, color: online ? '#00b96b' : '#999' }}>{statusText}</span>}
    </Tooltip>
  )
}
