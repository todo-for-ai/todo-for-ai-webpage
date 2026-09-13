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

import type { useCommandCenterData } from './useCommandCenterData'
import type { useCollabGraphPanel } from '../dashboard/hooks/useCollabGraphPanel'

interface Props {
  data: ReturnType<typeof useCommandCenterData>
  graph: ReturnType<typeof useCollabGraphPanel>
  tc: (k: string) => string
  tn: (...args: any[]) => string
  navigate: (...args: any[]) => void
}

/**
 * 指挥中心的 Agent 协作关系图卡片（窗口/布局/筛选工具条 + 全屏 + 明细 Modal）。
 * props 收双 hook 合并包与页面级助手，由 CommandCenter 页面原样拆出。
 */
export function CommandCenterCollabCard({ data, graph, tc, tn, navigate }: Props) {
  const {
    collabGraph,
    collabSummary,
    collabSvgRef,
    exportCollabGraph,
    exportCollabGraphPng,
    exportCollabGraphSvg,
    forceLinkDistance,
    forceRepulsion,
    graphKinds,
    graphLayout,
    graphMinCount,
    graphResetKey,
    graphSearch,
    graphShowLabels,
    graphWindow,
    loadCollabDetail,
    setForceLinkDistance,
    setForceRepulsion,
    setGraphFullscreen,
    setGraphKinds,
    setGraphLayout,
    setGraphMinCount,
    setGraphResetKey,
    setGraphSearch,
    setGraphShowLabels,
    setGraphWindow,
  } = { ...data, ...graph }

  return (
        <Card
          title={
            <Space>
              <ShareAltOutlined /> Agent 协作关系图
              {collabSummary && (
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                  {collabSummary.nodeCount} 节点 · {collabSummary.edgeCount} 边
                  {collabSummary.topPair && ` · 最活跃: ${collabSummary.topPair.source} ↔ ${collabSummary.topPair.target} (${collabSummary.topPair.count})`}
                </Text>
              )}
            </Space>
          }
          variant="borderless"
          style={{ marginTop: 16 }}
          extra={
            <Space size="small" wrap>
              <Segmented
                size="small"
                value={graphLayout}
                onChange={(v) => setGraphLayout(v as 'circular' | 'grid' | 'force')}
                options={[
                  { label: '环形', value: 'circular' },
                  { label: '网格', value: 'grid' },
                  { label: '力导向', value: 'force' },
                ]}
              />
              {graphLayout === 'force' && (
                <Space size={8}>
                  <Tooltip title="斥力强度（越大越分散）">
                    <Space size={4}><Text type="secondary" style={{ fontSize: 11 }}>斥力</Text><Slider min={0.2} max={3} step={0.1} value={forceRepulsion} onChange={setForceRepulsion} style={{ width: 80, margin: 0 }} /></Space>
                  </Tooltip>
                  <Tooltip title="链接距离（越大边越长）">
                    <Space size={4}><Text type="secondary" style={{ fontSize: 11 }}>距离</Text><Slider min={0.2} max={3} step={0.1} value={forceLinkDistance} onChange={setForceLinkDistance} style={{ width: 80, margin: 0 }} /></Space>
                  </Tooltip>
                </Space>
              )}
              <Segmented
                size="small"
                value={graphWindow}
                onChange={(v) => setGraphWindow(v as string)}
                options={[
                  { label: '7天', value: '7' },
                  { label: '30天', value: '30' },
                  { label: '全部', value: 'all' },
                ]}
              />
              <Select
                size="small"
                mode="multiple"
                maxTagCount="responsive"
                style={{ minWidth: 140 }}
                placeholder="全部类型"
                value={graphKinds}
                onChange={setGraphKinds}
                options={[
                  { value: 'coordinator', label: '协调者' },
                  { value: 'autonomous', label: '自主型' },
                  { value: 'assistant', label: '助手型' },
                  { value: 'external', label: '外部' },
                ]}
              />
              <Dropdown menu={{
                items: [
                  { key: 'csv', label: '导出 CSV', onClick: exportCollabGraph },
                  { key: 'svg', label: '导出 SVG', onClick: exportCollabGraphSvg },
                  { key: 'png', label: '导出 PNG', onClick: exportCollabGraphPng },
                ],
              }}>
                <Button size="small" icon={<DownloadOutlined />}>导出</Button>
              </Dropdown>
              <Input
                size="small"
                allowClear
                style={{ width: 140 }}
                placeholder="搜索 Agent 名称"
                prefix={<SearchOutlined />}
                value={graphSearch}
                onChange={(e) => setGraphSearch(e.target.value)}
              />
              <InputNumber
                size="small"
                min={1}
                placeholder="最低消息量"
                value={graphMinCount}
                onChange={(v) => setGraphMinCount(v ?? null)}
              />
              <Button size="small" icon={<ReloadOutlined />} onClick={() => { try { localStorage.removeItem('ccCollabGraphPositions') } catch { /* ignore */ } setGraphResetKey((k) => k + 1) }}>重置布局</Button>
              <Checkbox checked={graphShowLabels} onChange={(e) => setGraphShowLabels(e.target.checked)}>边标签</Checkbox>
              <Button size="small" icon={<ExpandOutlined />} onClick={() => setGraphFullscreen(true)}>全屏</Button>
            </Space>
          }
        >
          <CollaborationGraphView
            key={graphResetKey}
            ref={collabSvgRef}
            data={collabGraph}
            size={380}
            layout={graphLayout}
            filterKinds={graphKinds.length > 0 ? graphKinds : undefined}
            searchTerm={graphSearch || undefined}
            minCount={graphMinCount ?? undefined}
            showEdgeLabels={graphShowLabels}
            storageKey="ccCollabGraphPositions"
            forceRepulsion={forceRepulsion}
            forceLinkDistance={forceLinkDistance}
            onNodeClick={(agentId) => {
              const node = collabGraph?.nodes.find((n: any) => n.id === agentId)
              loadCollabDetail(agentId, node?.name || `Agent#${agentId}`)
            }}
          />
        </Card>
  )
}
