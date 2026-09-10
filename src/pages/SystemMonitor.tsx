/**
 * 系统监控页（System Monitor，仅管理员）
 *
 * 两个维度：
 * - 服务器：CPU / 内存 / 负载 / 磁盘 / API 进程（10s 自动刷新）；
 * - Agent 全局：总量/活跃/执行模式分布、反连在线、托管运行时、活跃租约、
 *   近 24h 尝试吞吐、最近活跃 Agent 列表。
 * 数据源：GET /system/monitor/server、GET /system/monitor/agents（管理员）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Progress,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import {
  CloudServerOutlined,
  DashboardOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { apiClient } from '../api'

interface ServerMetrics {
  available_psutil: boolean
  collected_at: string
  cpu: { count?: number; percent: number | null }
  load: { one: number | null; five: number | null; fifteen: number | null }
  memory: { total: number | null; used: number | null; percent: number | null }
  disk: { total: number | null; used: number | null; percent: number | null }
  process: {
    rss_bytes: number | null
    cpu_percent?: number | null
    create_time?: string
  }
}

interface AgentMetrics {
  collected_at: string
  agents: {
    total: number
    active: number
    managed_runner: number
    reverse_connect: number
  }
  runtimes: {
    remote_online: number
    remote_pending: number
    managed_occupying: number
  }
  tasks: {
    active_leases: number
    attempts_24h: Record<string, number>
  }
  recent_agents: Array<{
    id: number
    name: string
    status: string | null
    execution_mode: string | null
    engine: string | null
    runtime_phase: string | null
    last_seen_at: string | null
  }>
}

interface SetupState {
  complete: boolean
  has_admin: boolean
  has_agent: boolean
}

const REFRESH_MS = 10_000

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}

function phaseTag(phase: string | null) {
  if (phase === 'Running') return <Tag color="green">在线</Tag>
  if (phase === 'Pending') return <Tag color="orange">待连</Tag>
  return <Tag>{phase || '未知'}</Tag>
}

function SystemMonitor() {
  const [server, setServer] = useState<ServerMetrics | null>(null)
  const [agents, setAgents] = useState<AgentMetrics | null>(null)
  const [setup, setSetup] = useState<SetupState | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadServer = useCallback(async () => {
    const data = await apiClient.get<ServerMetrics>('/system/monitor/server')
    setServer(data)
  }, [])

  const loadAgents = useCallback(async () => {
    const data = await apiClient.get<AgentMetrics>('/system/monitor/agents')
    setAgents(data)
  }, [])

  const loadAll = useCallback(async (initial = false) => {
    try {
      setErrorMsg('')
      await Promise.all([loadServer(), loadAgents()])
      if (initial) {
        try {
          setSetup(await apiClient.get<SetupState>('/system/setup-state'))
        } catch {
          setSetup(null)
        }
      }
    } catch (err: any) {
      setErrorMsg(String(err?.message || err || '加载失败'))
    } finally {
      if (initial) setInitialLoading(false)
    }
  }, [loadServer, loadAgents])

  useEffect(() => {
    loadAll(true)
    timerRef.current = setInterval(() => loadAll(), REFRESH_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loadAll])

  const cpuPercent = server?.cpu?.percent
  const mem = server?.memory
  const disk = server?.disk
  const load = server?.load
  const cores = server?.cpu?.count

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Space align="center" style={{ marginBottom: 16 }}>
        <DashboardOutlined style={{ fontSize: 22 }} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          系统监控
        </Typography.Title>
        <Button
          icon={<ReloadOutlined />}
          size="small"
          onClick={() => loadAll()}
        >
          刷新
        </Button>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          每 10 秒自动刷新
        </Typography.Text>
      </Space>

      {setup && !setup.complete && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="部署尚未完成"
          description={
            <span>
              还差几步就能用起来。前往{' '}
              <Link to="/todo-for-ai/pages/deployment-guide">部署引导</Link>{' '}
              查看缺少什么。
            </span>
          }
        />
      )}

      {errorMsg && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="监控数据加载失败"
          description={errorMsg}
        />
      )}

      {initialLoading && !server && !agents ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin tip="正在采集监控数据…" />
        </div>
      ) : (
        <>
          {/* ── 服务器 ── */}
          <Card
            size="small"
            title={
              <Space>
                <CloudServerOutlined />
                服务器
              </Space>
            }
            extra={
              server && !server.available_psutil && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  安装 psutil 后可采集 CPU/内存
                </Typography.Text>
              )
            }
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <Typography.Text type="secondary">CPU</Typography.Text>
                {cpuPercent === null || cpuPercent === undefined ? (
                  <Typography.Paragraph style={{ marginTop: 8 }}>
                    未采集{cores ? `（${cores} 核）` : ''}
                  </Typography.Paragraph>
                ) : (
                  <>
                    <Progress
                      percent={Math.round(cpuPercent)}
                      status={cpuPercent >= 90 ? 'exception' : 'normal'}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {cores} 核
                    </Typography.Text>
                  </>
                )}
              </div>
              <div>
                <Typography.Text type="secondary">内存</Typography.Text>
                {mem?.percent === null || mem?.percent === undefined ? (
                  <Typography.Paragraph style={{ marginTop: 8 }}>-</Typography.Paragraph>
                ) : (
                  <>
                    <Progress
                      percent={Math.round(mem.percent as number)}
                      status={(mem.percent as number) >= 90 ? 'exception' : 'normal'}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatBytes(mem.used)} / {formatBytes(mem.total)}
                    </Typography.Text>
                  </>
                )}
              </div>
              <div>
                <Typography.Text type="secondary">负载（1/5/15 分钟）</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Space size={16}>
                    <Statistic
                      value={load?.one ?? '-'}
                      precision={(load?.one ?? 0) % 1 === 0 ? 0 : 2}
                      valueStyle={{ fontSize: 20 }}
                    />
                    <Statistic
                      value={load?.five ?? '-'}
                      precision={(load?.five ?? 0) % 1 === 0 ? 0 : 2}
                      valueStyle={{ fontSize: 20 }}
                    />
                    <Statistic
                      value={load?.fifteen ?? '-'}
                      precision={(load?.fifteen ?? 0) % 1 === 0 ? 0 : 2}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Space>
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {cores ? `建议 5 分钟负载 < ${cores}` : ''}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">磁盘（工作目录）</Typography.Text>
                {disk?.percent === null || disk?.percent === undefined ? (
                  <Typography.Paragraph style={{ marginTop: 8 }}>-</Typography.Paragraph>
                ) : (
                  <>
                    <Progress
                      percent={Math.round(disk.percent as number)}
                      status={(disk.percent as number) >= 90 ? 'exception' : 'normal'}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatBytes(disk.used)} / {formatBytes(disk.total)}
                    </Typography.Text>
                  </>
                )}
              </div>
              <div>
                <Typography.Text type="secondary">API 进程内存</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Statistic
                    value={formatBytes(server?.process?.rss_bytes)}
                    valueStyle={{ fontSize: 20 }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* ── Agent 全局 ── */}
          <Card
            size="small"
            title={
              <Space>
                <TeamOutlined />
                Agent 全局
              </Space>
            }
            extra={
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                采集于 {formatTime(agents?.collected_at)}
              </Typography.Text>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <Statistic title="Agent 总量" value={agents?.agents.total ?? '-'} />
              <Statistic title="活跃" value={agents?.agents.active ?? '-'} />
              <Statistic
                title="反连在线"
                value={agents?.runtimes.remote_online ?? '-'}
                valueStyle={{ color: '#389e0d' }}
              />
              <Statistic
                title="反连待连"
                value={agents?.runtimes.remote_pending ?? '-'}
              />
              <Statistic
                title="托管运行中"
                value={agents?.runtimes.managed_occupying ?? '-'}
              />
              <Statistic
                title="活跃租约"
                value={agents?.tasks.active_leases ?? '-'}
              />
            </div>

            <Typography.Text type="secondary">近 24 小时任务尝试</Typography.Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 16,
                margin: '8px 0 16px',
              }}
            >
              <Statistic
                title="新建"
                value={agents?.tasks.attempts_24h?.created ?? 0}
              />
              <Statistic
                title="执行中"
                value={agents?.tasks.attempts_24h?.active ?? 0}
              />
              <Statistic
                title="已提交"
                value={agents?.tasks.attempts_24h?.committed ?? 0}
                valueStyle={{ color: '#389e0d' }}
              />
              <Statistic
                title="已中止"
                value={agents?.tasks.attempts_24h?.aborted ?? 0}
                valueStyle={{ color: '#d46b08' }}
              />
            </div>

            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={agents?.recent_agents || []}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 70 },
                { title: '名称', dataIndex: 'name', ellipsis: true },
                {
                  title: '执行模式',
                  dataIndex: 'execution_mode',
                  width: 110,
                  render: (mode: string | null) =>
                    mode === 'managed_runner' ? (
                      <Tag color="blue">托管</Tag>
                    ) : (
                      <Tag>反连</Tag>
                    ),
                },
                { title: '引擎', dataIndex: 'engine', width: 100 },
                {
                  title: '运行时',
                  dataIndex: 'runtime_phase',
                  width: 100,
                  render: (phase: string | null) => phaseTag(phase),
                },
                {
                  title: '最近心跳',
                  dataIndex: 'last_seen_at',
                  width: 170,
                  render: (v: string | null) => formatTime(v),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default SystemMonitor
