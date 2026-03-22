import { useEffect, useState } from 'react'
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

  const [loadedTabs, setLoadedTabs] = useState<AgentDetailTabKey[]>(() => [activeTab])

  useEffect(() => {
    setLoadedTabs((previous) => (previous.includes(activeTab) ? previous : [...previous, activeTab]))
  }, [activeTab])

  const isTabLoaded = (tabKey: AgentDetailTabKey) => loadedTabs.includes(tabKey)

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
    <Card title={tp('detail.title', { defaultValue: 'Agent Detail' })} className='agent-detail-tabs-card flat-card'>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        className='flat-tabs'
        items={[
          {
            key: 'overview',
            label: tp('detail.tabs.overview', { defaultValue: 'Overview' }),
            children: isTabLoaded('overview') ? <AgentOverviewTab agent={agent} /> : null,
          },
          {
            key: 'activity',
            label: tp('detail.tabs.activity', { defaultValue: 'Activity' }),
            children: isTabLoaded('activity') ? (
              <AgentActivityTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'activity'} />
            ) : null,
          },
          {
            key: 'projects',
            label: tp('detail.tabs.projects', { defaultValue: 'Projects' }),
            children: isTabLoaded('projects') ? (
              <AgentProjectsTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'projects'} />
            ) : null,
          },
          {
            key: 'interactions',
            label: tp('detail.tabs.interactions', { defaultValue: 'Interactions' }),
            children: isTabLoaded('interactions') ? (
              <AgentInteractionsTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'interactions'} />
            ) : null,
          },
          {
            key: 'tasks',
            label: tp('detail.tabs.tasks', { defaultValue: 'Tasks' }),
            children: isTabLoaded('tasks') ? (
              <AgentTasksTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'tasks'} />
            ) : null,
          },
          {
            key: 'runs',
            label: tp('detail.tabs.runs', { defaultValue: 'Runs' }),
            children: isTabLoaded('runs') ? (
              <AgentRunsTab workspaceId={workspaceId} agentId={agent.id} active={activeTab === 'runs'} />
            ) : null,
          },
          {
            key: 'keys',
            label: tp('detail.tabs.keys', { defaultValue: 'Keys' }),
            children: isTabLoaded('keys') ? (
              <AgentKeysCard workspaceId={workspaceId} agentId={agent.id} agentName={agent.name} />
            ) : null,
          },
          {
            key: 'soul',
            label: tp('detail.tabs.soul', { defaultValue: 'SOUL Versions' }),
            children: isTabLoaded('soul') ? (
              <AgentSoulVersionsCard
                workspaceId={workspaceId}
                agentId={agent.id}
                soulVersion={agent.soul_version}
                onAfterRollback={onAfterRollback}
              />
            ) : null,
          },
          {
            key: 'secrets',
            label: tp('detail.tabs.secrets', { defaultValue: 'Secrets' }),
            children: isTabLoaded('secrets') ? <AgentSecretsCard workspaceId={workspaceId} agentId={agent.id} /> : null,
          },
        ]}
      />
    </Card>
  )
}

export default AgentDetailTabs
