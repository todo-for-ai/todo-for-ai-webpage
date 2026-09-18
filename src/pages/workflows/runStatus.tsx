import React from 'react'
import {
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  ReloadOutlined, StopOutlined,
} from '@ant-design/icons'

/** 步骤运行状态 → Tag 颜色/图标（Workflows 页与控制台共用，勿在组件内再复制） */
export const STEP_STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'default', icon: <ClockCircleOutlined /> },
  waiting: { color: 'warning', icon: <ClockCircleOutlined /> },
  running: { color: 'processing', icon: <ReloadOutlined spin /> },
  succeeded: { color: 'success', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', icon: <CloseCircleOutlined /> },
  skipped: { color: 'default', icon: <StopOutlined /> },
  cancelled: { color: 'default', icon: <StopOutlined /> },
}

/** 工作流运行状态 → Tag 颜色 */
export const WORKFLOW_STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'default',
}
