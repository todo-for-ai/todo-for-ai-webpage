// Agent 分析卡共享的阶段配色与文案助手（由 AgentAnalyticsSection 沉淀）。
export const IDLE_STAGE_COLOR: Record<string, string> = { active: '#52c41a', idle: '#1890ff', stale: '#faad14', dormant: '#ff4d4f', never: '#8c8c8c' }
export const IDLE_STAGE_ZH: Record<string, string> = { active: '活跃', idle: '空闲', stale: '陈旧', dormant: '休眠', never: '从未' }
export const stageColor = (s: string) => IDLE_STAGE_COLOR[s] || '#8c8c8c'
export const stageZh = (s: string) => IDLE_STAGE_ZH[s] || s
