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
 * 指挥中心的解决冲突与安全事件明细 Modal 群。
 * props 收双 hook 合并包与页面级助手，由 CommandCenter 页面原样拆出。
 */
export function CommandCenterModals({ data, graph, tc, tn, navigate }: Props) {
  const {
    collabDetail,
    collabDetailGraph,
    collabGraph,
    eventDetail,
    forceLinkDistance,
    forceRepulsion,
    graphFullscreen,
    graphFullscreenSize,
    graphKinds,
    graphLayout,
    graphMinCount,
    graphSearch,
    graphShowLabels,
    loadCollabDetail,
    loading,
    resolveForm,
    resolveOpen,
    setCollabDetail,
    setEventDetail,
    setGraphFullscreen,
    setResolveForm,
    setResolveOpen,
    submitResolveConflict,
  } = { ...data, ...graph }

  return (
    <>
      {/* 解决冲突 Modal */}
      <Modal
        title={`解决冲突 #${resolveForm.conflict_id}`}
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={submitResolveConflict}
        okText="解决"
      >
        <Form layout="vertical">
          <Form.Item label="解决策略" required>
            <Select value={resolveForm.strategy} onChange={(v) => setResolveForm({ ...resolveForm, strategy: v })}>
              <Select.Option value="first_wins">先到先得 (保留最早分配)</Select.Option>
              <Select.Option value="highest_reputation">最高声誉 (声誉最佳者胜出)</Select.Option>
              <Select.Option value="least_loaded">最少负载 (活跃任务最少者胜出)</Select.Option>
              <Select.Option value="auto_retry">自动重试 (取消过期/重新排队)</Select.Option>
              <Select.Option value="split">拆分 (分配给多方)</Select.Option>
              <Select.Option value="escalate">升级 (转交协调者)</Select.Option>
              <Select.Option value="manual">人工 (仅记录)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="解决说明">
            <Input.TextArea value={resolveForm.description} onChange={(e) => setResolveForm({ ...resolveForm, description: e.target.value })} placeholder="可选: 解决备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 安全事件详情 Modal */}
      <SecurityEventDetailModal
        event={eventDetail}
        onClose={() => setEventDetail(null)}
        onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
      />

      {/* 协作图节点点击：协作明细 Modal */}
      <Modal
        title={`${collabDetail?.name || ''} 的协作伙伴`}
        open={!!collabDetail}
        onCancel={() => setCollabDetail(null)}
        footer={[
          <Button key="detail" type="link" onClick={() => { if (collabDetail) navigate(`/todo-for-ai/pages/agents?agent_id=${collabDetail.agentId}`) }}>
            查看 Agent 详情
          </Button>,
          <Button key="close" onClick={() => setCollabDetail(null)}>关闭</Button>,
        ]}
      >
        <Spin spinning={collabDetail?.loading}>
          {collabDetail && collabDetail.list.length > 0 ? (
            <>
              {collabDetailGraph && (
                <div style={{ marginBottom: 12 }}>
                  <CollaborationGraphView
                    data={collabDetailGraph}
                    size={260}
                    layout="grid"
                    centerNodeId={collabDetail.agentId}
                    storageKey={`ccCollabGraphDetail_${collabDetail.agentId}`}
                  />
                </div>
              )}
              <List
                size="small"
                dataSource={collabDetail.list}
                renderItem={(c: any) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#1890ff' }}>{c.name}</Text>
                      <Space size={4}>
                        <Tag>发 {c.sent}</Tag>
                        <Tag>收 {c.received}</Tag>
                        <Tag color="blue">合计 {c.total}</Tag>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </>
          ) : (
            <Text type="secondary">暂无协作伙伴记录</Text>
          )}
        </Spin>
      </Modal>

      {/* 协作关系图全屏 Modal */}
      <Modal
        title="Agent 协作关系图（全屏）"
        open={graphFullscreen}
        onCancel={() => setGraphFullscreen(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        destroyOnClose
      >
        <CollaborationGraphView
          data={collabGraph}
          size={graphFullscreenSize}
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
            setGraphFullscreen(false)
            loadCollabDetail(agentId, node?.name || `Agent#${agentId}`)
          }}
        />
      </Modal>
    </>
  )
}
