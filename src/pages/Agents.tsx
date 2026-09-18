import React from 'react'
import AgentsBoardSection from './agents/AgentsBoardSection'
import AgentsOpsModals from './agents/AgentsOpsModals'
import AgentsCollabModals from './agents/AgentsCollabModals'
import { useAgentsPage } from './agents/useAgentsPage'

/**
 * Agents 页面壳：全部状态/动作收敛在 useAgentsPage 组合根，
 * 这里只负责注入三个视图区块（看板 + 运维弹窗簇 + 协作弹窗簇）。
 */
const Agents: React.FC = () => {
  const page = useAgentsPage()

  return (
    <div style={{ padding: 24 }}>
      <AgentsBoardSection {...page} />
      <AgentsOpsModals {...page} />
      <AgentsCollabModals {...page} />
    </div>
  )
}

export default Agents
