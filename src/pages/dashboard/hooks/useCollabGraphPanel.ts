import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import dayjs from 'dayjs'
import { agentsApi, type CollaborationGraph, type CollaborationGraphTimeline } from '../../../api/agents'
import { buildCollabGraphCsv, downloadBlob, filterGraph, preparePngSvgSource, serializeSvg } from '../collabGraphExport'

/**
 * Agent 协作关系图面板：图数据 + 视图状态（布局/力导向参数/kind 筛选/全屏）+
 * 摘要与节点明细 + 三种格式导出（CSV/SVG/PNG）。从 useDashboardData 原样拆出。
 */
export function useCollabGraphPanel() {
  const [collabGraph, setCollabGraph] = useState<CollaborationGraph | null>(null)
  const [collabTimeline, setCollabTimeline] = useState<CollaborationGraphTimeline | null>(null)
  const [collabTimelineIdx, setCollabTimelineIdx] = useState(0)
  const [collabGraphLoading, setCollabGraphLoading] = useState(false)
  const collabSvgRef = useRef<SVGSVGElement>(null)
  // 节点点击展开的协作明细 Modal
  const [collabDetail, setCollabDetail] = useState<{ agentId: number; name: string; list: any[]; loading: boolean } | null>(null)

  // Agent 协作关系图
  const [graphWindow, setGraphWindow] = useState<string>('30')
  const [graphLayout, setGraphLayout] = useState<'circular' | 'grid' | 'force'>('circular')
  // 力导向参数：从 localStorage 恢复，变更时持久化
  const FORCE_PARAMS_KEY = 'collabGraphForceParams'
  const loadForceParams = (): { repulsion: number; linkDistance: number } => {
    try {
      const raw = localStorage.getItem(FORCE_PARAMS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        return {
          repulsion: typeof p.repulsion === 'number' ? p.repulsion : 1,
          linkDistance: typeof p.linkDistance === 'number' ? p.linkDistance : 1,
        }
      }
    } catch { /* ignore */ }
    return { repulsion: 1, linkDistance: 1 }
  }
  const [initialForceParams] = useState(loadForceParams)
  const [forceRepulsion, setForceRepulsion] = useState(initialForceParams.repulsion)
  const [forceLinkDistance, setForceLinkDistance] = useState(initialForceParams.linkDistance)
  useEffect(() => {
    try { localStorage.setItem(FORCE_PARAMS_KEY, JSON.stringify({ repulsion: forceRepulsion, linkDistance: forceLinkDistance })) } catch { /* ignore */ }
  }, [forceRepulsion, forceLinkDistance])
  const [graphKinds, setGraphKinds] = useState<string[]>([])
  const [graphSearch, setGraphSearch] = useState('')
  const [graphMinCount, setGraphMinCount] = useState<number | null>(null)
  const [graphResetKey, setGraphResetKey] = useState(0)
  const [graphShowLabels, setGraphShowLabels] = useState(false)
  const [graphFullscreen, setGraphFullscreen] = useState(false)
  const [graphFullscreenSize, setGraphFullscreenSize] = useState(720)

  // 全屏协作图尺寸随窗口自适应
  useEffect(() => {
    const update = () => {
      const s = Math.min(window.innerWidth - 80, window.innerHeight - 160, 900)
      setGraphFullscreenSize(Math.max(360, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // 协作图摘要（反映 kind 筛选 + minCount）：节点数/边数/最活跃协作对
  const collabSummary = useMemo(() => {
    if (!collabGraph) return null
    const { nodes, edges } = filterGraph(collabGraph, { kinds: graphKinds, minCount: graphMinCount })
    if (edges.length === 0) return { nodeCount: nodes.length, edgeCount: 0, topPair: null }
    const top = edges.reduce((m, e) => (e.count > m.count ? e : m), edges[0])
    const topPair = { source: nodes.find((n) => n.id === top.source)?.name, target: nodes.find((n) => n.id === top.target)?.name, count: top.count }
    return { nodeCount: nodes.length, edgeCount: edges.length, topPair }
  }, [collabGraph, graphKinds, graphMinCount])

  // 协作明细 Modal 内嵌迷你子图：以选中 Agent 为中心
  const collabDetailGraph = useMemo<CollaborationGraph | null>(() => {
    if (!collabDetail || collabDetail.list.length === 0) return null
    const center = collabDetail
    const nodes = [
      { id: center.agentId, name: center.name, kind: undefined, messages: 0 },
      ...collabDetail.list.map((c: any) => ({ id: c.agent_id, name: c.name, kind: undefined, messages: c.total })),
    ]
    nodes[0].messages = collabDetail.list.reduce((s: number, c: any) => s + (c.total || 0), 0)
    const edges = collabDetail.list.map((c: any) => ({
      source: Math.min(center.agentId, c.agent_id),
      target: Math.max(center.agentId, c.agent_id),
      count: c.total,
      ...(center.agentId < c.agent_id
        ? { source_to_target: c.sent, target_to_source: c.received }
        : { source_to_target: c.received, target_to_source: c.sent }),
    }))
    return { nodes, edges, total_edges: edges.length }
  }, [collabDetail])

  const loadCollabGraph = useCallback(async (window: string) => {
    setCollabGraphLoading(true)
    try {
      const since = window === 'all' ? undefined : dayjs().subtract(Number(window), 'day').toISOString()
      const g = await agentsApi.getCollaborationGraph(since ? { limit: 50, since } : { limit: 50 }).catch(() => null)
      setCollabGraph(g)
    } catch {
      // silent
    } finally {
      setCollabGraphLoading(false)
    }
  }, [])

  // 点击协作图节点：加载该 Agent 的 top 协作者明细
  const loadCollabDetail = useCallback(async (agentId: number, name: string) => {
    setCollabDetail({ agentId, name, list: [], loading: true })
    try {
      const result = await agentsApi.getAgentCollaborators(agentId, { limit: 10 })
      setCollabDetail({ agentId, name, list: result?.collaborators || [], loading: false })
    } catch {
      setCollabDetail({ agentId, name, list: [], loading: false })
    }
  }, [])

  useEffect(() => {
    loadCollabGraph(graphWindow)
  }, [loadCollabGraph, graphWindow])

  // 导出协作关系图为 CSV（节点段 + 边段，反映当前 kind 筛选）
  const exportCollabGraph = useCallback(() => {
    if (!collabGraph || (!collabGraph.nodes.length && !collabGraph.edges.length)) {
      message.warning('暂无协作关系数据可导出')
      return
    }
    const text = buildCollabGraphCsv(collabGraph, { kinds: graphKinds, minCount: graphMinCount })
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `collaboration_graph_${new Date().toISOString().slice(0, 10)}.csv`)
    message.success('协作关系图已导出为 CSV')
  }, [collabGraph, graphKinds, graphMinCount])

  // 导出协作关系图为 SVG 图片（保留可视化形态）
  const exportCollabGraphSvg = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const text = serializeSvg(svg)
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    downloadBlob(blob, `collaboration_graph_${new Date().toISOString().slice(0, 10)}.svg`)
    message.success('协作关系图已导出为 SVG')
  }, [])

  // 导出协作关系图为 PNG（SVG → Canvas → PNG）
  const exportCollabGraphPng = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const { text, width, height } = preparePngSvgSource(svg)
    const svgBlob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const scale = 2 // 2x 提升清晰度
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); message.error('PNG 导出失败'); return }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { message.error('PNG 导出失败'); return }
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(pngUrl)
        message.success('协作关系图已导出为 PNG')
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); message.error('PNG 导出失败：SVG 渲染失败') }
    img.src = url
  }, [])

  return {
    collabGraph,
    setCollabGraph,
    collabGraphLoading,
    setCollabGraphLoading,
    collabTimeline,
    setCollabTimeline,
    collabTimelineIdx,
    setCollabTimelineIdx,
    graphWindow,
    setGraphWindow,
    graphLayout,
    setGraphLayout,
    loadForceParams,
    forceRepulsion,
    setForceRepulsion,
    forceLinkDistance,
    setForceLinkDistance,
    graphKinds,
    setGraphKinds,
    graphSearch,
    setGraphSearch,
    graphMinCount,
    setGraphMinCount,
    graphResetKey,
    setGraphResetKey,
    graphShowLabels,
    setGraphShowLabels,
    graphFullscreen,
    setGraphFullscreen,
    graphFullscreenSize,
    setGraphFullscreenSize,
    collabSummary,
    collabDetail,
    setCollabDetail,
    collabDetailGraph,
    loadCollabGraph,
    loadCollabDetail,
    collabSvgRef,
    exportCollabGraph,
    exportCollabGraphSvg,
    exportCollabGraphPng,
  }
}
