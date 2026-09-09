/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, InputNumber, message, Progress, Row, Statistic, Typography } from 'antd'
import { runtimeSettingsApi } from '../../../api/runtimeSettings'
import type { WorkspaceRuntimeSettings } from '../../../api/runtimeSettings'

const { Text } = Typography

interface OrgRuntimeSettingsTabProps {
  organizationId: number
  canManage?: boolean
}

/**
 * 组织「运行时」Tab：多 Agent 编排并发上限、在岗 Pod 上限、空闲回收阈值。
 * 设置是「最多多少个 Agent 同时干活」的唯一入口；同时显示当前干活水位。
 */
export const OrgRuntimeSettingsTab = ({ organizationId, canManage = false }: OrgRuntimeSettingsTabProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<WorkspaceRuntimeSettings | null>(null)
  const [activeAgents, setActiveAgents] = useState(0)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await runtimeSettingsApi.get(organizationId)
      setSettings(data.settings)
      setActiveAgents(data.orchestration?.active_agents ?? 0)
      form.setFieldsValue(data.settings)
    } catch (error: any) {
      message.error(error?.message || '加载运行时设置失败')
    } finally {
      setLoading(false)
    }
  }, [organizationId, form])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const data = await runtimeSettingsApi.update(organizationId, values)
      setSettings(data.settings)
      setActiveAgents(data.orchestration?.active_agents ?? 0)
      message.success('运行时设置已保存')
    } catch (error: any) {
      if (error?.message) {
        message.error(error.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const limit = settings?.max_concurrent_agents ?? 0
  const usagePercent = limit > 0 ? Math.min(100, Math.round((activeAgents / limit) * 100)) : 0

  return (
    <div style={{ maxWidth: 720 }}>
      <Card loading={loading} title='多 Agent 编排与运行时配额' extra={
        canManage ? (
          <Button type='primary' loading={saving} onClick={handleSave}>保存设置</Button>
        ) : null
      }>
        {!canManage && (
          <Alert type='info' showIcon message='仅工作区管理员可以修改这些设置' style={{ marginBottom: 16 }} />
        )}

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic title='正在干活的 Agent' value={activeAgents} suffix={limit > 0 ? `/ ${limit}` : '（不限）'} />
          </Col>
          <Col span={16} style={{ display: 'flex', alignItems: 'center' }}>
            {limit > 0 ? (
              <Progress
                percent={usagePercent}
                status={activeAgents >= limit ? 'exception' : 'normal'}
                style={{ width: '100%' }}
              />
            ) : (
              <Text type='secondary'>当前未限制同时干活的 Agent 数量</Text>
            )}
          </Col>
        </Row>

        <Form form={form} layout='vertical' disabled={!canManage}>
          <Form.Item
            name='max_concurrent_agents'
            label='同时干活的 Agent 数上限'
            extra='0 = 不限制。按正在执行任务的 Agent 去重计数；超出上限后新任务排队等待，已在干活的 Agent 不受影响。云端资源与用户 token 有限时建议设置。'
            rules={[{ required: true, message: '请填写并发 Agent 上限' }]}
          >
            <InputNumber min={0} max={200} step={1} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item
            name='max_pods'
            label='在岗 Agent Pod 上限'
            extra='0 = 使用系统默认。云端托管 Runner 同时运行的 Pod 数量上限。'
            rules={[{ required: true, message: '请填写 Pod 上限' }]}
          >
            <InputNumber min={0} max={100} step={1} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item
            name='idle_timeout_minutes'
            label='Pod 空闲回收阈值（分钟）'
            extra='0 = 不回收。空闲超过该时长的托管 Pod 会被回收以节省资源。'
            rules={[{ required: true, message: '请填写空闲回收阈值' }]}
          >
            <InputNumber min={0} max={10080} step={5} style={{ width: 200 }} />
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
