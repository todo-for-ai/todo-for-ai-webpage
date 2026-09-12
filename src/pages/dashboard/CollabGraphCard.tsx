/**
 * Dashboard「Agent 协作关系图」面板（从 Dashboard.tsx 原样抽出）。
 */

import type { Dispatch, SetStateAction } from 'react'
import type { CollaborationGraph, CollaborationGraphTimeline } from '../../api/agents'
import { Button, Card, Checkbox, Dropdown, Input, InputNumber, Segmented, Select, Slider, Space, Spin, Tooltip, Typography } from 'antd'
import { DownloadOutlined, ExpandOutlined, ReloadOutlined, SearchOutlined, ShareAltOutlined } from '@ant-design/icons'
import CollaborationGraphView from '../../components/CollaborationGraphView'

const { Text } = Typography

interface CollabGraphCardProps {
  collabGraph: any
  collabGraphLoading: boolean
  collabSvgRef: any
  collabSummary: any
  exportCollabGraph: any
  exportCollabGraphPng: any
  exportCollabGraphSvg: any
  forceLinkDistance: number
  forceRepulsion: number
  graphKinds: any
  graphLayout: string
  graphMinCount: any
  graphResetKey: number
  graphSearch: string
  graphShowLabels: boolean
  graphWindow: string
  loadCollabDetail: any
  setForceLinkDistance: any
  setForceRepulsion: any
  setGraphFullscreen: any
  setGraphKinds: any
  setGraphLayout: any
  setGraphMinCount: any
  setGraphResetKey: any
  setGraphSearch: any
  setGraphShowLabels: any
  setGraphWindow: any
}

export default function CollabGraphCard(props: CollabGraphCardProps) {
  const { collabGraph,
    collabGraphLoading, collabSvgRef,
    collabSummary,
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
    setGraphWindow } = props
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
        style={{ marginBottom: 24 }}
        extra={
          <Space wrap>
            <Segmented
              size="small"
              value={graphLayout}
              onChange={(v) => setGraphLayout(v as 'circular' | 'grid' | 'force')}
              options={[
                { value: 'circular', label: '环形' },
                { value: 'grid', label: '网格' },
                { value: 'force', label: '力导向' },
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
                { value: '7', label: '7天' },
                { value: '30', label: '30天' },
                { value: 'all', label: '全部' },
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
            <Button size="small" icon={<ReloadOutlined />} onClick={() => { try { localStorage.removeItem('collabGraphPositions') } catch { /* ignore */ } setGraphResetKey((k) => k + 1) }}>重置布局</Button>
            <Checkbox checked={graphShowLabels} onChange={(e) => setGraphShowLabels(e.target.checked)}>边标签</Checkbox>
            <Button size="small" icon={<ExpandOutlined />} onClick={() => setGraphFullscreen(true)}>全屏</Button>
          </Space>
        }
      >
        <Spin spinning={collabGraphLoading}>
          <CollaborationGraphView
            key={graphResetKey}
            ref={collabSvgRef}
            data={collabGraph}
            size={380}
            layout={graphLayout as any}
            filterKinds={graphKinds.length > 0 ? graphKinds : undefined}
            searchTerm={graphSearch || undefined}
            minCount={graphMinCount ?? undefined}
            showEdgeLabels={graphShowLabels}
            storageKey="collabGraphPositions"
            forceRepulsion={forceRepulsion}
            forceLinkDistance={forceLinkDistance}
            onNodeClick={(agentId) => {
              const node = collabGraph?.nodes.find((n) => n.id === agentId)
              loadCollabDetail(agentId, node?.name || `Agent#${agentId}`)
            }}
          />
        </Spin>
      </Card>
  )
}
