/**
 * 部署引导页（Deployment Guide）
 *
 * 面向管理员的部署自检视图：消费 GET /system/deploy/check 报告，
 * 按「版本一致性 / 必需配置 / 数据库 / 迁移完整性 / 运行时环境」分组渲染
 * 检查项状态（通过/警告/失败）与修复提示（hint），帮助部署者快速定位
 * 缺了什么、下一步装什么。
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  List,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  CloudServerOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { apiClient } from '../api'

interface DeployCheck {
  name: string
  category: string
  status: 'pass' | 'warning' | 'error'
  detail: string
  hint?: string
}

interface DeployReport {
  ok: boolean
  summary: { total: number; pass: number; error: number; warning: number }
  checks: DeployCheck[]
  schema_version?: number
}

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  version: {
    title: '版本一致性',
    description: '代码声明的部署 schema 版本与迁移文件是否对齐',
  },
  env: {
    title: '必需配置',
    description: '密钥类环境变量是否就位、是否还残留模板占位符',
  },
  database: {
    title: '数据库',
    description: '数据库连通性',
  },
  migration: {
    title: '迁移完整性',
    description: '关键表/列是否已随迁移建好',
  },
  runtime: {
    title: '运行时环境',
    description:
      '执行环境后端（k8s/docker/compose/baremetal/remote 反连）前置条件与 Agent 接入状态',
  },
}

const CATEGORY_ORDER = ['version', 'env', 'database', 'migration', 'runtime']

const STATUS_TAG: Record<string, { color: string; text: string }> = {
  pass: { color: 'green', text: '通过' },
  warning: { color: 'orange', text: '警告' },
  error: { color: 'red', text: '失败' },
}

function shortName(name: string): string {
  // runtime.backend.docker -> backend.docker，避免与分组标题重复
  return name.startsWith('runtime.') ? name.slice('runtime.'.length) : name
}

function DeploymentGuide() {
  const [report, setReport] = useState<DeployReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    setForbidden(false)
    try {
      const data = await apiClient.get<DeployReport>('/system/deploy/check')
      setReport(data)
    } catch (err: any) {
      if (err?.status === 403) {
        setForbidden(true)
      } else {
        setErrorMsg(String(err?.message || err || '加载失败'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const grouped = useMemo(() => {
    if (!report) return []
    const byCategory = new Map<string, DeployCheck[]>()
    for (const check of report.checks) {
      const list = byCategory.get(check.category) || []
      list.push(check)
      byCategory.set(check.category, list)
    }
    const known = CATEGORY_ORDER.filter(c => byCategory.has(c)).map(c => ({
      category: c,
      items: byCategory.get(c)!,
    }))
    // 未知分类兜底展示（后端新增分组时前端不至于丢信息）
    for (const [category, items] of byCategory.entries()) {
      if (!CATEGORY_ORDER.includes(category)) {
        known.push({ category, items })
      }
    }
    return known
  }, [report])

  if (forbidden) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          showIcon
          message="需要管理员权限"
          description="部署引导自检报告仅对管理员开放。请使用管理员账号登录后重试。"
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Space align="center" style={{ marginBottom: 16 }}>
        <CloudServerOutlined style={{ fontSize: 22 }} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          部署引导
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading} size="small">
          重新自检
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        自检覆盖版本一致性、必需配置、数据库与迁移完整性、运行时环境（执行环境后端与
        Agent 接入）。出现「失败」项按提示处理即可；「警告」不阻断部署。
      </Typography.Paragraph>

      {errorMsg && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="自检报告加载失败"
          description={errorMsg}
        />
      )}

      {loading && !report && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin tip="正在执行部署自检…" />
        </div>
      )}

      {report && (
        <>
          <Alert
            type={report.ok ? 'success' : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
            message={report.ok ? '部署自检通过' : '部署存在未解决问题'}
            description={`共 ${report.summary.total} 项：${report.summary.pass} 通过、${report.summary.warning} 警告、${report.summary.error} 失败${
              report.schema_version ? `（部署 schema 版本 ${report.schema_version}）` : ''
            }`}
          />

          {report.ok && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="部署已完成，本页主要面向首次安装"
              description={
                <span>
                  日常运维请使用{' '}
                  <Link to="/todo-for-ai/pages/system-monitor">系统监控</Link>
                  （服务器 CPU/内存/负载 与 Agent 全局状态）；部署出问题时随时回到本页重新自检。
                </span>
              }
            />
          )}

          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category]
            const hasProblem = items.some(i => i.status === 'error')
            return (
              <Card
                key={category}
                size="small"
                title={meta?.title || category}
                extra={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {meta?.description}
                  </Typography.Text>
                }
                style={{
                  marginBottom: 16,
                  borderColor: hasProblem ? '#ffa39e' : undefined,
                }}
              >
                <List
                  size="small"
                  dataSource={items}
                  renderItem={item => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <Space wrap align="center" size={8}>
                          <Tag color={STATUS_TAG[item.status]?.color || 'default'}>
                            {STATUS_TAG[item.status]?.text || item.status}
                          </Tag>
                          <Typography.Text code style={{ fontSize: 12 }}>
                            {shortName(item.name)}
                          </Typography.Text>
                          <Typography.Text style={{ fontSize: 13 }}>
                            {item.detail}
                          </Typography.Text>
                        </Space>
                        {item.hint && (
                          <div style={{ marginTop: 4, paddingLeft: 8 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              处理建议：{item.hint}
                            </Typography.Text>
                          </div>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}

export default DeploymentGuide
