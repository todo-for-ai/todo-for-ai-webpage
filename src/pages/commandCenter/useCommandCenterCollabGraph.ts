import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Space, Button, Tooltip, Empty, Badge, Alert, Popconfirm, Modal, Form, Select, Input, InputNumber, Segmented, Dropdown, Checkbox, Slider } from 'antd'
import {
  ReloadOutlined,
  ApiOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ControlOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  ShareAltOutlined,
  SearchOutlined,
  ExpandOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../../api/dashboard'
import { agentsApi, type OrchestratorStatus, type ConflictsTrend, type ConflictsByAgent, type ConflictsStrategyStats } from '../../api/agents'
import dayjs from 'dayjs'
import SecurityTrendSection from '../../components/SecurityTrendSection'
import SecurityEventListItem from '../../components/SecurityEventListItem'
import SecurityEventDetailModal from '../../components/SecurityEventDetailModal'
import CollaborationGraphView from '../../components/CollaborationGraphView'
import PlatformActivityTrendSection from '../../components/PlatformActivityTrendSection'
import ConflictsTrendChart from '../../components/ConflictsTrendChart'
import { useCollaborationSSE } from '../../hooks/useCollaborationSSE'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { CommandCenterStatsRow, SecurityEventTrendAlert, QuickActionsCard, AgentMonitorCard, SecurityEventsCard, OrchestratorStatusCard, PRApprovalsCard } from '../command-center'
import { PageIntro } from '../../components/common/PageIntro'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Title, Text, Paragraph } = Typography

/**
 * Agent 协作指挥中心：单一页面聚合 Agent 监控、安全事件、冲突、编排状态
 * 四大数据源，作为统一指挥入口。支持手动刷新与 SSE 实时刷新。
 */

/**
指挥中心的 Agent 协作关系图面板：图数据/视图状态/摘要明细/三种导出。由 CommandCenter 原样拆出。
 */
export function useCommandCenterCollabGraph() {
  const [collabGraph, setCollabGraph] = useState<any>(null)
  const [collabGraphLoading, setCollabGraphLoading] = useState(false)
  const collabSvgRef = useRef<SVGSVGElement>(null)
  const [collabDetail, setCollabDetail] = useState<{ agentId: number; name: string; list: any[]; loading: boolean } | null>(null)
  const [graphWindow, setGraphWindow] = useState<string>('30')
  const [graphLayout, setGraphLayout] = useState<'circular' | 'grid' | 'force'>('circular')
  // 力导向参数：从 localStorage 恢复，变更时持久化（与 Dashboard 共享同一 key）
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

  // 协作图摘要（反映 kind 筛选 + minCount）
  const collabSummary = useMemo(() => {
    if (!collabGraph) return null
    const kindSet = graphKinds.length > 0 ? new Set(graphKinds) : null
    const kindNodes = kindSet ? collabGraph.nodes.filter((n: any) => n.kind && kindSet.has(n.kind)) : collabGraph.nodes
    const kindIds = new Set(kindNodes.map((n: any) => n.id))
    const minC = graphMinCount && graphMinCount > 0 ? graphMinCount : 0
    const edges = collabGraph.edges.filter((e: any) => {
      if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
      if (minC && e.count < minC) return false
      return true
    })
    const usedIds = new Set<number>()
    edges.forEach((e: any) => { usedIds.add(e.source); usedIds.add(e.target) })
    const nodes = kindNodes.filter((n: any) => usedIds.has(n.id))
    if (edges.length === 0) return { nodeCount: nodes.length, edgeCount: 0, topPair: null }
    const top = edges.reduce((m: any, e: any) => (e.count > m.count ? e : m), edges[0])
    const topPair = { source: nodes.find((n: any) => n.id === top.source)?.name, target: nodes.find((n: any) => n.id === top.target)?.name, count: top.count }
    return { nodeCount: nodes.length, edgeCount: edges.length, topPair }
  }, [collabGraph, graphKinds, graphMinCount])

  // 协作明细 Modal 内嵌迷你子图：以选中 Agent 为中心
  const collabDetailGraph = useMemo(() => {
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
  // Agent 协作关系图（独立加载，避免 loadAll 膨胀）
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
  // 导出协作关系图为 CSV（反映当前 kind 筛选）
  const exportCollabGraph = useCallback(() => {
    if (!collabGraph || (!collabGraph.nodes?.length && !collabGraph.edges?.length)) {
      message.warning('暂无协作关系数据可导出')
      return
    }
    const kindSet = graphKinds.length > 0 ? new Set(graphKinds) : null
    const kindNodes = kindSet ? collabGraph.nodes.filter((n: any) => n.kind && kindSet.has(n.kind)) : collabGraph.nodes
    const kindIds = new Set(kindNodes.map((n: any) => n.id))
    const minC = graphMinCount && graphMinCount > 0 ? graphMinCount : 0
    const edges = collabGraph.edges.filter((e: any) => {
      if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
      if (minC && e.count < minC) return false
      return true
    })
    const usedIds = new Set<number>()
    edges.forEach((e: any) => { usedIds.add(e.source); usedIds.add(e.target) })
    const nodes = kindNodes.filter((n: any) => usedIds.has(n.id))
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines: string[] = []
    lines.push('# 节点')
    lines.push(['id', 'name', 'kind', 'messages'].map(esc).join(','))
    nodes.forEach((n: any) => lines.push([n.id, n.name, n.kind ?? '', n.messages].map(esc).join(',')))
    lines.push('')
    lines.push('# 边')
    lines.push(['source', 'target', 'count', 'source_to_target', 'target_to_source'].map(esc).join(','))
    edges.forEach((e: any) => lines.push([e.source, e.target, e.count, e.source_to_target ?? 0, e.target_to_source ?? 0].map(esc).join(',')))
    const text = '﻿' + lines.join('\n')
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('协作关系图已导出为 CSV')
  }, [collabGraph, graphKinds, graphMinCount])

  // 导出协作关系图为 SVG 图片
  const exportCollabGraphSvg = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const text = new XMLSerializer().serializeToString(clone)
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('协作关系图已导出为 SVG')
  }, [])

  // 导出协作关系图为 PNG（SVG → Canvas → PNG）
  const exportCollabGraphPng = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(svg.viewBox.baseVal.width || svg.clientWidth || 380))
    clone.setAttribute('height', String(svg.viewBox.baseVal.height || svg.clientHeight || 380))
    const text = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const w = Number(clone.getAttribute('width')) || 380
      const h = Number(clone.getAttribute('height')) || 380
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = w * scale
      canvas.height = h * scale
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
    graphWindow,
    setGraphWindow,
    graphLayout,
    setGraphLayout,
    FORCE_PARAMS_KEY,
    loadForceParams,
    initialForceParams,
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
    collabDetailGraph,
    loadCollabGraph,
    loadCollabDetail,
    exportCollabGraph,
    exportCollabGraphSvg,
    exportCollabGraphPng,
    collabGraph,
    setCollabGraph,
    collabGraphLoading,
    setCollabGraphLoading,
    collabSvgRef,
    collabDetail,
    setCollabDetail,
  }
}
