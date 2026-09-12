/**
 * Dashboard「协作图时段回放」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useMemo, useState } from 'react'
import { Button, Card, Empty, Slider, Space, Table, Typography } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'

const { Text } = Typography

interface Props {
  collabTimeline: any
  collabTimelineIdx: any
  setCollabTimelineIdx: any
}

export default function TimelineReplayCard(props: Props) {
  const { collabTimeline,
    collabTimelineIdx,
    setCollabTimelineIdx } = props

  return (
    <>
      {/* Collaboration Graph Timeline Replay */}
      {collabTimeline && collabTimeline.snapshots.length > 0 && (
        <Card
          title={<Space><HistoryOutlined /> 协作图时段回放</Space>}
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {collabTimeline.snapshots[collabTimelineIdx]?.date} · {collabTimeline.snapshots[collabTimelineIdx]?.active_agents ?? 0} Agent · {collabTimeline.snapshots[collabTimelineIdx]?.total_edges ?? 0} 边
              </Text>
            </Space>
          }
        >
          <div>
            <Slider
              min={0}
              max={Math.max(0, collabTimeline.snapshots.length - 1)}
              value={collabTimelineIdx}
              onChange={setCollabTimelineIdx}
              marks={collabTimeline.snapshots.length <= 14 ? Object.fromEntries(
                collabTimeline.snapshots.map((s, i) => [i, { label: <span style={{ fontSize: 9 }}>{s.date.slice(5)}</span> }])
              ) : undefined}
              tooltip={{ formatter: (v) => collabTimeline.snapshots[v ?? 0]?.date ?? '' }}
            />
            {(() => {
              const snap = collabTimeline.snapshots[collabTimelineIdx]
              if (!snap || snap.edges.length === 0) return <Empty description="该时段无协作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              const maxCount = Math.max(1, ...snap.edges.map(e => e.count))
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                  {snap.edges.slice(0, 15).map((e, ei) => (
                    <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={e.source_name}>{e.source_name}</span>
                      <span style={{ color: '#bfbfbf' }}>↔</span>
                      <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={e.target_name}>{e.target_name}</span>
                      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 2, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${(e.count / maxCount) * 100}%`, height: '100%', background: `hsl(${210 - (e.count / maxCount) * 60}, 70%, 50%)`, borderRadius: 2 }} />
                      </div>
                      <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{e.count}</span>
                    </div>
                  ))}
                  {snap.edges.length > 15 && (
                    <Text type="secondary" style={{ fontSize: 10 }}>还有 {snap.edges.length - 15} 条边...</Text>
                  )}
                </div>
              )
            })()}
          </div>
        </Card>
      )}
    </>
  )
}
