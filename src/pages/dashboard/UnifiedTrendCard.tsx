/**
 * Dashboard「UnifiedTrendCard」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Card, Col, Row, Typography, Statistic, Table, Tag, Tooltip, Empty, Space, Button, Segmented, Select, DatePicker, Checkbox, Badge, Alert, Spin, List, Modal, Input, InputNumber, Dropdown, Progress } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import PlatformActivityTrendSection from '../../components/PlatformActivityTrendSection'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface Props {
  orchDailyTrend: any
  securityTrend: any
  trendEventType: any
  setTrendEventType: any
  setTrendSeverity: any
  setTrendWindow: any
  trendSeverity: any
  trendWindow: any
  unifiedSecTrend: any
}

export default function UnifiedTrendCard(props: Props) {
  const { orchDailyTrend,
    securityTrend,
    trendEventType, setTrendEventType, setTrendSeverity, setTrendWindow,
    trendSeverity,
    trendWindow,
    unifiedSecTrend } = props
  const { tp } = usePageTranslation('dashboard')

  return (
    <>
      <Card
        title={<Space><LineChartOutlined /> 平台活动统一趋势</Space>}
        style={{ marginBottom: 24 }}
        extra={
          <Space wrap>
            <Segmented
              size="small"
              value={trendEventType || 'all'}
              onChange={(v) => setTrendEventType(v === 'all' ? '' : v as string)}
              options={[
                { value: 'all', label: '全类型' },
                { value: 'sandbox_violation', label: '沙盒' },
                { value: 'conflict', label: '冲突' },
                { value: 'audit', label: '审计' },
              ]}
            />
            <Segmented
              size="small"
              value={trendSeverity || 'all'}
              onChange={(v) => setTrendSeverity(v === 'all' ? '' : v as string)}
              options={[
                { value: 'all', label: '全部' },
                { value: 'CRITICAL', label: '高危' },
                { value: 'WARNING', label: '警告' },
                { value: 'INFO', label: '普通' },
              ]}
            />
            <Segmented
              size="small"
              value={trendWindow}
              onChange={(v) => setTrendWindow(v as string)}
              options={[
                { value: '7', label: '7天' },
                { value: '30', label: '30天' },
                { value: 'all', label: '全部' },
              ]}
            />
          </Space>
        }
      >
        <PlatformActivityTrendSection
          orchestratorTrend={orchDailyTrend}
          securityTrend={unifiedSecTrend}
        />
      </Card>
    </>
  )
}
