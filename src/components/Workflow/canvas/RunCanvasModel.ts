/** 运行态画布的状态视觉语义（仓库 UI 约束：蓝/绿/橙/中性，不用紫） */

export const RUN_STATUS_STYLE: Record<string, {
  label: string
  color: string
  bg: string
  border: string
}> = {
  pending: { label: '待执行', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
  waiting: { label: '等待中', color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  running: { label: '运行中', color: '#1677ff', bg: '#e6f4ff', border: '#1677ff' },
  succeeded: { label: '成功', color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
  failed: { label: '失败', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  skipped: { label: '已跳过', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
  cancelled: { label: '已取消', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' },
}

export const runStatusStyle = (status?: string) =>
  RUN_STATUS_STYLE[status ?? 'pending'] ?? RUN_STATUS_STYLE.pending
