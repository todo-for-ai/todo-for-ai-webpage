import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Empty, Progress, Space, Tag, Typography, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { skillProfileApi } from '../../../api/agents/skill-profile'
import type { AgentSkillProfile, SkillProfileSkill } from '../../../api/agents/skill-profile'

const { Text, Paragraph } = Typography

const KIND_COLORS: Record<string, string> = {
  domain: 'purple',
  task_type: 'cyan',
  capability: 'geekblue',
}

interface SkillProfileCardProps {
  agentId: number
}

export function SkillProfileCard({ agentId }: SkillProfileCardProps) {
  const [profile, setProfile] = useState<AgentSkillProfile | null>(null)
  const [stale, setStale] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await skillProfileApi.get(agentId)
      setProfile(data.profile)
      setStale(data.stale)
    } catch (error: any) {
      message.error(error?.message || '加载技能画像失败')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    void load()
  }, [load])

  const rebuild = async () => {
    setRebuilding(true)
    try {
      const data = await skillProfileApi.rebuild(agentId)
      setProfile(data.profile)
      setStale(false)
      message.success('技能画像已重建')
    } catch (error: any) {
      message.error(error?.message || '重建失败（需要管理权限）')
    } finally {
      setRebuilding(false)
    }
  }

  const skills: SkillProfileSkill[] = profile?.skills || []

  return (
    <Card
      size="small"
      title="技能画像"
      extra={
        <Space>
          {stale && <Tag color="orange">画像可能过期</Tag>}
          <Button size="small" icon={<ReloadOutlined />} loading={rebuilding} onClick={() => void rebuild()}>
            重建
          </Button>
        </Space>
      }
      loading={loading}
    >
      <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 12 }}>
        从运行历史自动聚合的技能画像（经验与任务执行结果），用于派单时的优先级加分。
      </Paragraph>
      {!profile ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未生成画像，点击「重建」从运行历史聚合" />
      ) : (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space size={16} wrap>
            <Text type="secondary">
              任务完成 <Text strong>{profile.assignments.completed}</Text>
            </Text>
            <Text type="secondary">
              任务失败 <Text strong>{profile.assignments.failed}</Text>
            </Text>
            <Text type="secondary">
              经验记录 <Text strong>{profile.experience_count}</Text>
            </Text>
          </Space>
          {skills.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无技能数据" />
          ) : (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {skills.slice(0, 8).map((skill) => {
                const percent = skill.success_rate == null ? 0 : Math.round(skill.success_rate * 100)
                return (
                  <div key={`${skill.kind}-${skill.name}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={KIND_COLORS[skill.kind] || 'default'} style={{ minWidth: 88, textAlign: 'center' }}>
                      {skill.name}
                    </Tag>
                    <Progress
                      percent={percent}
                      size="small"
                      style={{ flex: 1, marginBottom: 0 }}
                      status={percent >= 50 ? 'success' : percent > 0 ? 'exception' : 'normal'}
                    />
                    <Text type="secondary" style={{ fontSize: 12, minWidth: 96, textAlign: 'right' }}>
                      {skill.count} 次 · 成功率 {percent}%
                    </Text>
                  </div>
                )
              })}
            </Space>
          )}
        </Space>
      )}
    </Card>
  )
}

export default SkillProfileCard
