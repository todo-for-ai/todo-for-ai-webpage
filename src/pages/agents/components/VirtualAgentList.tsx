import { useRef, useCallback, useState, useEffect } from 'react'
import { Avatar, Card, Empty, Skeleton, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { Agent } from '../../../api/agents'
import { resolveUserAvatarSrc } from '../../../utils/defaultAvatars'
import './VirtualAgentList.css'

const { Text } = Typography

// 列表项高度
const ITEM_HEIGHT = 72
// 缓冲区大小（上下各多渲染几项）
const BUFFER_SIZE = 3

interface VirtualAgentListProps {
  agents: Agent[]
  loading: boolean
  workspaceId: number | null
  containerHeight?: number
  onLoadMore?: () => void
  hasMore?: boolean
}

export function VirtualAgentList({
  agents,
  loading,
  workspaceId,
  containerHeight = 600,
  onLoadMore,
  hasMore,
}: VirtualAgentListProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  // 计算可视区域
  const totalHeight = agents.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + 2 * BUFFER_SIZE
  const endIndex = Math.min(agents.length, startIndex + visibleCount)

  // 可视的 agents
  const visibleAgents = agents.slice(startIndex, endIndex)
  const offsetY = startIndex * ITEM_HEIGHT

  // 处理滚动
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      setScrollTop(scrollTop)

      // 触发加载更多
      if (onLoadMore && hasMore && scrollHeight - scrollTop - clientHeight < ITEM_HEIGHT * 3) {
        onLoadMore()
      }
    }
  }, [onLoadMore, hasMore])

  // 使用 Intersection Observer 优化可见性检测
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleScroll()
          }
        })
      },
      { threshold: 0 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [handleScroll])

  const toAgentDetail = (agentId: number) => {
    navigate(`/todo-for-ai/pages/agents/${agentId}/overview${workspaceId ? `?workspace_id=${workspaceId}` : ''}`)
  }

  if (loading && agents.length === 0) {
    return (
      <div className="virtual-agent-list__loading">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="virtual-agent-list__skeleton-card">
            <Skeleton.Avatar active size="large" shape="circle" />
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>
    )
  }

  if (!loading && agents.length === 0) {
    return <Empty description="No agents found" className="virtual-agent-list__empty" />
  }

  return (
    <div
      ref={containerRef}
      className="virtual-agent-list"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleAgents.map((agent, index) => {
            const actualIndex = startIndex + index
            return (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={actualIndex}
                onClick={() => toAgentDetail(agent.id)}
              />
            )
          })}
        </div>
        {loading && hasMore && (
          <div className="virtual-agent-list__loading-more">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        )}
      </div>
    </div>
  )
}

interface AgentCardProps {
  agent: Agent
  index: number
  onClick: () => void
}

function AgentCard({ agent, index, onClick }: AgentCardProps) {
  const statusColorMap: Record<string, string> = {
    active: 'green',
    inactive: 'orange',
    revoked: 'default',
  }

  return (
    <Card
      className="virtual-agent-list__card"
      style={{
        height: ITEM_HEIGHT,
        position: 'absolute',
        top: index * ITEM_HEIGHT,
        left: 0,
        right: 0,
        margin: '0 8px',
        cursor: 'pointer',
      }}
      bodyStyle={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onClick={onClick}
      hoverable
    >
      <Avatar
        src={resolveUserAvatarSrc(agent.avatar_url, agent.name)}
        size={48}
        style={{ backgroundColor: '#1677ff', flexShrink: 0 }}
      >
        {agent.display_name?.charAt(0) || agent.name.charAt(0)}
      </Avatar>

      <div className="virtual-agent-list__content">
        <div className="virtual-agent-list__header">
          <Text strong className="virtual-agent-list__name">
            {agent.display_name || agent.name}
          </Text>
          {agent.is_owner && (
            <Tag color="gold" className="virtual-agent-list__owner-tag">
              Owner
            </Tag>
          )}
          <Tag
            color={statusColorMap[agent.status] || 'default'}
            className="virtual-agent-list__status-tag"
          >
            {agent.status}
          </Tag>
        </div>
        <Text type="secondary" className="virtual-agent-list__meta">
          #{agent.id} · {agent.capability_tags?.slice(0, 3).join(', ') || 'No tags'}
        </Text>
      </div>
    </Card>
  )
}
