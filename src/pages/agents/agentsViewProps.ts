/**
 * Agents 页视图组件的 props 类型：直接取组合根上下文（真实类型，替代旧的 any 大接口）。
 * 三个视图区块从 ctx 解构各自需要的字段，页面壳用 {...page} 展开注入。
 */
import type { AgentsPageContext } from './useAgentsPage'

export type AgentsOpsModalsProps = AgentsPageContext
export type AgentsCollabModalsProps = AgentsPageContext
export type AgentsBoardSectionProps = AgentsPageContext
