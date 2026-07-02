import React, { useState, useCallback, useRef } from 'react'
import { Popover, Spin, Typography } from 'antd'
import { agentsApi, type ReputationHistory } from '../api/agents'
import ReputationSparkline from './ReputationSparkline'

const { Text } = Typography

interface ReputationTrendPopoverProps {
  agentId: number
  score: number
  /** 列单元格已有的着色 span，作为触发器子元素 */
  children: React.ReactNode
}

/**
 * 声誉趋势 Popover：hover 触发后懒加载该 Agent 的声誉历史并展示趋势迷你图。
 *
 * 首次 hover 才请求，结果缓存在 ref 中避免重复请求；加载失败时仅显示当前分，
 * 不抛错打断表格交互。
 */
const ReputationTrendPopover: React.FC<ReputationTrendPopoverProps> = ({ agentId, score, children }) => {
  const [history, setHistory] = useState<ReputationHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const loadedRef = useRef(false)

  const handleOpenChange = useCallback((visible: boolean) => {
    setOpen(visible)
    if (visible && !loadedRef.current) {
      loadedRef.current = true
      setLoading(true)
      agentsApi
        .getAgentReputationHistory(agentId, { limit: 100 })
        .then((h) => setHistory(h))
        .catch(() => { loadedRef.current = false })
        .finally(() => setLoading(false))
    }
  }, [agentId])

  const content = (
    <div style={{ width: 260 }}>
      {loading ? (
        <Spin size="small" />
      ) : history && history.points.length > 0 ? (
        <>
          <Text type="secondary" style={{ fontSize: 11 }}>
            声誉趋势 · 当前 {history.current_score?.toFixed(1)} · {history.points.length} 次变化
          </Text>
          <ReputationSparkline points={history.points} currentScore={history.current_score} width={248} height={64} />
        </>
      ) : (
        <Text type="secondary" style={{ fontSize: 11 }}>暂无声誉变化记录（仅有成功任务时不记审计）</Text>
      )}
    </div>
  )

  return (
    <Popover content={content} trigger="hover" open={open} onOpenChange={handleOpenChange} placement="left">
      {children}
    </Popover>
  )
}

export default ReputationTrendPopover
