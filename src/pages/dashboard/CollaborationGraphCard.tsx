/**
 * 协作图谱卡片组件
 *
 * 展示 Agent 协作关系图，支持多种布局（环形、网格、力导向）。
 * 包含图谱搜索、类型筛选、消息量阈值过滤、导出和全屏功能。
 */
import { Card, Spin, Space, Segmented, Select, Dropdown, Button, Input, InputNumber, Checkbox, Slider, Tooltip } from 'antd'
import { ShareAltOutlined, DownloadOutlined, SearchOutlined, ExpandOutlined, ReloadOutlined } from '@ant-design/icons'
import type { FC, RefObject } from 'react'
import CollaborationGraphView from '../../components/CollaborationGraphView'
import type { CollaborationGraph } from '../../api/agents'

interface CollaborationGraphCardProps {
  collabGraph: CollaborationGraph | null
  collabGraphLoading: boolean
  collabSummary: { nodeCount: number; edgeCount: number; topPair?: { source: string; target: string; count: number } } | null
  graphLayout: 'circular' | 'grid' | 'force'
  onLayoutChange: (layout: 'circular' | 'grid' | 'force') => void
  graphWindow: string
  onWindowChange: (window: string) => void
  graphKinds: string[]
  onKindsChange: (kinds: string[]) => void
  graphSearch: string
  onSearchChange: (search: string) => void
  graphMinCount: number | null
  onMinCountChange: (count: number | null) => void
  graphShowLabels: boolean
  onShowLabelsChange: (show: boolean) => void
  graphResetKey: number
  onResetLayout: () => void
  onFullscreen: () => void
  forceRepulsion: number
  onForceRepulsionChange: (val: number) => void
  forceLinkDistance: number
  onForceLinkDistanceChange: (val: number) => void
  collabSvgRef: RefObject<any>
  onNodeClick: (agentId: number) => void
  onExportCsv: () => void
  onExportSvg: () => void
  onExportPng: () => void
}

const CollaborationGraphCard: FC<CollaborationGraphCardProps> = ({
  collabGraph,
  collabGraphLoading,
  collabSummary,
  graphLayout,
  onLayoutChange,
  graphWindow,
  onWindowChange,
  graphKinds,
  onKindsChange,
  graphSearch,
  onSearchChange,
  graphMinCount,
  onMinCountChange,
  graphShowLabels,
  onShowLabelsChange,
  graphResetKey,
  onResetLayout,
  onFullscreen,
  forceRepulsion,
  onForceRepulsionChange,
  forceLinkDistance,
  onForceLinkDistanceChange,
  collabSvgRef,
  onNodeClick,
  onExportCsv,
  onExportSvg,
  onExportPng,
}) => {
  const Text = ({ type, children }: { type?: any; children: React.ReactNode }) => <span>{children}</span>

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
            onChange={(v) => onLayoutChange(v as 'circular' | 'grid' | 'force')}
            options={[
              { value: 'circular', label: '环形' },
              { value: 'grid', label: '网格' },
              { value: 'force', label: '力导向' },
            ]}
          />
          {graphLayout === 'force' && (
            <Space size={8}>
              <Tooltip title="斥力强度（越大越分散）">
                <Space size={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>斥力</Text>
                  <Slider min={0.2} max={3} step={0.1} value={forceRepulsion} onChange={onForceRepulsionChange} style={{ width: 80, margin: 0 }} />
                </Space>
              </Tooltip>
              <Tooltip title="链接距离（越大边越长）">
                <Space size={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>距离</Text>
                  <Slider min={0.2} max={3} step={0.1} value={forceLinkDistance} onChange={onForceLinkDistanceChange} style={{ width: 80, margin: 0 }} />
                </Space>
              </Tooltip>
            </Space>
          )}
          <Segmented
            size="small"
            value={graphWindow}
            onChange={(v) => onWindowChange(v as string)}
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
            onChange={onKindsChange}
            options={[
              { value: 'coordinator', label: '协调者' },
              { value: 'autonomous', label: '自主型' },
              { value: 'assistant', label: '助手型' },
              { value: 'external', label: '外部' },
            ]}
          />
          <Dropdown menu={{
            items: [
              { key: 'csv', label: '导出 CSV', onClick: onExportCsv },
              { key: 'svg', label: '导出 SVG', onClick: onExportSvg },
              { key: 'png', label: '导出 PNG', onClick: onExportPng },
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
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <InputNumber
            size="small"
            min={1}
            placeholder="最低消息量"
            value={graphMinCount}
            onChange={(v) => onMinCountChange(v ?? null)}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={onResetLayout}>重置布局</Button>
          <Checkbox checked={graphShowLabels} onChange={(e) => onShowLabelsChange(e.target.checked)}>边标签</Checkbox>
          <Button size="small" icon={<ExpandOutlined />} onClick={onFullscreen}>全屏</Button>
        </Space>
      }
    >
      <Spin spinning={collabGraphLoading}>
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
          storageKey="collabGraphPositions"
          forceRepulsion={forceRepulsion}
          forceLinkDistance={forceLinkDistance}
          onNodeClick={onNodeClick}
        />
      </Spin>
    </Card>
  )
}

export default CollaborationGraphCard