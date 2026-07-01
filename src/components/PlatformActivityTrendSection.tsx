import React from 'react'
import { Typography, Space, Tag, Empty } from 'antd'
import type { SecurityDailyTrend, OrchestratorDailyTrend } from '../api/agents'
import MiniTrendChart from './MiniTrendChart'

const { Text } = Typography

interface PlatformActivityTrendSectionProps {
  /** 编排按天趋势，无则编排序列不绘制 */
  orchestratorTrend: OrchestratorDailyTrend | null
  /** 安全事件按天趋势，无则安全序列不绘制 */
  securityTrend: SecurityDailyTrend | null
  /** 画布高度（默认 140） */
  height?: number
}

/**
 * 平台活动统一趋势视图：把编排活动与安全事件按天合并到同一时间轴。
 *
 * 两组数据各有独立的日期集合，这里取并集并升序排列，对每个日期从两组
 * 各取对应值（缺失补 0），在同一张 MiniTrendChart 上叠 5 条序列：
 *   编排触发数(蓝)、编排冲突解决(绿)、沙盒违规(红)、冲突(橙)、审计(灰)
 *
 * 让运营者在一张图上看清「编排做了多少」与「安全出了多少」的协同关系。
 * 纯展示组件，Dashboard 顶部总览用。
 */
const PlatformActivityTrendSection: React.FC<PlatformActivityTrendSectionProps> = ({
  orchestratorTrend,
  securityTrend,
  height = 140,
}) => {
  const orchDays = orchestratorTrend?.days || []
  const secDays = securityTrend?.days || []

  if (orchDays.length === 0 && secDays.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无平台活动趋势数据" style={{ margin: '8px 0' }} />
  }

  // 日期并集，升序
  const dateSet = new Set<string>()
  orchDays.forEach((d) => dateSet.add(d.date))
  secDays.forEach((d) => dateSet.add(d.date))
  const dates = Array.from(dateSet).sort()

  // 索引化两组数据便于按日期取值
  const orchMap = new Map(orchDays.map((d) => [d.date, d]))
  const secMap = new Map(secDays.map((d) => [d.date, d]))

  const labels = dates.map((d) => d.slice(5)) // MM-DD
  const series = []
  if (orchDays.length > 0) {
    series.push({
      key: 'orch_triggers',
      label: '编排触发',
      color: '#1890ff',
      values: dates.map((d) => orchMap.get(d)?.triggers_fired || 0),
    })
    series.push({
      key: 'orch_resolved',
      label: '编排解决冲突',
      color: '#52c41a',
      values: dates.map((d) => orchMap.get(d)?.conflicts_resolved || 0),
    })
  }
  if (secDays.length > 0) {
    series.push({
      key: 'sec_sandbox',
      label: '沙盒违规',
      color: '#cf1322',
      values: dates.map((d) => secMap.get(d)?.sandbox_violation || 0),
    })
    series.push({
      key: 'sec_conflict',
      label: '安全冲突',
      color: '#fa8c16',
      values: dates.map((d) => secMap.get(d)?.conflict || 0),
    })
    series.push({
      key: 'sec_audit',
      label: '审计',
      color: '#8c8c8c',
      values: dates.map((d) => secMap.get(d)?.audit || 0),
    })
  }

  const orchTotals = orchestratorTrend?.totals
  const secTotals = securityTrend?.totals

  return (
    <div>
      <MiniTrendChart labels={labels} series={series} height={height} />
      <Space wrap size={[8, 4]} style={{ marginTop: 8 }}>
        {orchTotals && (
          <>
            <Tag color="blue">编排触发 {orchTotals.triggers_fired ?? 0}</Tag>
            <Tag color="green">编排解决冲突 {orchTotals.conflicts_resolved ?? 0}</Tag>
            <Tag>编排运行 {orchTotals.runs ?? 0} 次</Tag>
          </>
        )}
        {secTotals && (
          <>
            <Tag color="red">沙盒违规 {secTotals.sandbox_violation ?? 0}</Tag>
            <Tag color="orange">安全冲突 {secTotals.conflict ?? 0}</Tag>
            <Tag>审计 {secTotals.audit ?? 0}</Tag>
          </>
        )}
      </Space>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
        统一按天聚合，编排活动与安全事件同时间轴对比。
      </Text>
    </div>
  )
}

export default PlatformActivityTrendSection
