import { useState } from 'react'
import { Card, Tabs } from 'antd'
import type { Agent } from '../../../api/agents'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import { AgentKeysCard } from './AgentKeysCard'
import { AgentSecretsCard } from './AgentSecretsCard'
import { AgentSoulVersionsCard } from './AgentSoulVersionsCard'
import { AgentActivityTab } from './detailTabs/AgentActivityTab'
import { AgentInteractionsTab } from './detailTabs/AgentInteractionsTab'
import { AgentOverviewTab } from './detailTabs/AgentOverviewTab'
import { AgentProjectsTab } from './detailTabs/AgentProjectsTab'
import { AgentRunsTab } from './detailTabs/AgentRunsTab'
import { AgentTasksTab } from './detailTabs/AgentTasksTab'
import './AgentDetailTabs.css'

interface AgentDetailTabsProps {
  workspaceId: number | null
  agent: Agent
  onAfterRollback: () => void | Promise<void>
  activeTab?: AgentDetailTabKey
  onTabChange?: (tab: AgentDetailTabKey) => void
}

export const AGENT_DETAIL_TAB_KEYS = [
  'overview',
  'activity',
  'projects',
  'interactions',
  'tasks',
  'runs',
  'keys',
  'soul',
  'secrets',
] as const

export type AgentDetailTabKey = (typeof AGENT_DETAIL_TAB_KEYS)[number]

const agentDetailTabKeySet = new Set<string>(AGENT_DETAIL_TAB_KEYS)

export function isAgentDetailTabKey(value: string | null | undefined): value is AgentDetailTabKey {
  return Boolean(value && agentDetailTabKeySet.has(value))
}

export function AgentDetailTabs({
  workspaceId,
  agent,
  onAfterRollback,
  activeTab: controlledActiveTab,
  onTabChange,
}: AgentDetailTabsProps) {
  const { tp } = usePageTranslation('agents')
  const [internalActiveTab, setInternalActiveTab] = useState<AgentDetailTabKey>('overview')
  const activeTab = controlledActiveTab && isAgentDetailTabKey(controlledActiveTab) ? controlledActiveTab : internalActiveTab

  const handleTabChange = (nextKey: string) => {
    if (!isAgentDetailTabKey(nextKey)) {
      return
    }
    if (!controlledActiveTab) {
      setInternalActiveTab(nextKey)
    }
    onTabChange?.(nextKey)
  }

  return (
    <Card title={tp('detail.title', { defaultValue: 'Agent Detail' })} className='agent-detail-tabs-card'>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'overview',
            label: tp('detail.tabs.overview', { defaultValue: 'Overview' }),
            children: <AgentOverviewTab agent={agent} />,
          },
          {
            key: 'activity',
            label: tp('detail.tabs.activity', { defaultValue: 'Activity' }),
            children: <AgentActivityTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'activity'} />,
          },
          {
            key: 'projects',
            label: tp('detail.tabs.projects', { defaultValue: 'Projects' }),
            children: <AgentProjectsTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'projects'} />,
          },
          {
            key: 'interactions',
            label: tp('detail.tabs.interactions', { defaultValue: 'Interactions' }),
            children: <AgentInteractionsTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'interactions'} />,
          },
          {
            key: 'tasks',
            label: tp('detail.tabs.tasks', { defaultValue: 'Tasks' }),
            children: <AgentTasksTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'tasks'} />,
          },
          {
            key: 'runs',
            label: tp('detail.tabs.runs', { defaultValue: 'Runs' }),
            children: <AgentRunsTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'runs'} />,
          },
          {
            key: 'keys',
            label: tp('detail.tabs.keys', { defaultValue: 'Keys' }),
            children: <AgentKeysCard workspaceId={workspaceId} agentId={agent.id} agentName={agent.name} />,
          },
          {
            key: 'soul',
            label: tp('detail.tabs.soul', { defaultValue: 'SOUL Versions' }),
            children: (
              <AgentSoulVersionsCard
                workspaceId={workspaceId}
                agentId={agent.id}
                soulVersion={agent.soul_version}
                onAfterRollback={onAfterRollback}
              />
            ),
          },
          {
            key: 'secrets',
            label: tp('detail.tabs.secrets', { defaultValue: 'Secrets' }),
            children: <AgentSecretsCard workspaceId={workspaceId} agentId={agent.id} />,
          },
        ]}
      />
    </Card>
  )
}

export default AgentDetailTabs
