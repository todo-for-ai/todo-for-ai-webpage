import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ConfigProvider, Spin, Tag, Tooltip, theme as antdTheme } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { tasksApi } from '../../api/tasks'
import { useTaskRealtime } from '../../hooks/useTaskRealtime'
import ConsoleSidebar from './ConsoleSidebar'
import ConsoleTranscript from './ConsoleTranscript'
import ConsoleInfoPanel from './ConsoleInfoPanel'
import { consoleStatusMeta, type ConsoleTaskLike } from './consoleData'

/**
 * 全屏 Web 工作台（对标 AI 编程工具的远程控制台界面）：
 * 左侧任务流 + 中间会话时间线 + 右侧信息面板。
 * 深色、无管理侧边栏；路由 /todo-for-ai/pages/console（AuthGuard 内、AppLayout 外）。
 */
/** 像素皮肤（mario-theme.css 全局 .ant-btn-primary 等）会压过 antd 主题 token，
 *  工作台用命名空间规则按皮肤 compat 层同款手法夺回主色（绿）并保持小圆角。 */
const CONSOLE_SCOPE_CSS = `
.tfai-console .ant-btn.ant-btn-primary { background: #00b96b; border-color: #00b96b; }
.tfai-console .ant-btn.ant-btn-primary:not(:disabled):hover { background: #23b888; border-color: #23b888; }
.tfai-console .ant-switch.ant-switch-checked { background: #00b96b; }
.tfai-console .ant-input,
.tfai-console .ant-input textarea { background: transparent; }
.tfai-console .ant-select-selector { background: #232428 !important; }
`

export const ConsoleWorkspace: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState<ConsoleTaskLike[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [infoCollapsed, setInfoCollapsed] = useState(false)

  const selectedId = useMemo(() => {
    const raw = searchParams.get('task')
    return raw ? Number(raw) : null
  }, [searchParams])

  const loadTasks = useCallback(async () => {
    try {
      const res = await tasksApi.getTasks({ per_page: 100, sort_by: 'updated_at', sort_order: 'desc' } as any)
      const items: any[] = (res as any)?.items || (Array.isArray(res) ? res : [])
      // 工作台聚焦可交给 Agent 的任务：AI 任务且非子任务
      const ai = items.filter(t => t.is_ai_task && !t.parent_task_id)
      setTasks(ai.length > 0 || items.length === 0 ? ai : items)
    } catch {
      // 静默：保留上一次列表
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (id: number) => {
    try {
      const t = await tasksApi.getTask(id)
      setDetail(t)
    } catch {
      setDetail(null)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  // 选中任务的房间推送（状态变化/留言）→ 刷新详情与列表
  const onSelectedEvent = useCallback(() => {
    if (selectedId) loadDetail(selectedId)
    loadTasks()
  }, [selectedId, loadDetail, loadTasks])
  useTaskRealtime({ taskId: selectedId || 0, onTaskUpdate: onSelectedEvent, onComment: onSelectedEvent })

  // 列表页兜底轮询（未进房间的任务也要刷相对时间与状态点）
  useEffect(() => {
    const timer = setInterval(loadTasks, 15000)
    return () => clearInterval(timer)
  }, [loadTasks])

  const handleSelect = useCallback((id: number) => {
    setSearchParams({ task: String(id) })
  }, [setSearchParams])

  const handleCreated = useCallback((id: number) => {
    loadTasks().then(() => setSearchParams({ task: String(id) }))
  }, [loadTasks, setSearchParams])

  // 首次进入且 URL 无 task：自动选最新的执行中任务，否则第一条
  useEffect(() => {
    if (selectedId || tasks.length === 0) return
    const preferred = tasks.find(t => t.status === 'in_progress') || tasks[0]
    setSearchParams({ task: String(preferred.id) }, { replace: true })
  }, [tasks, selectedId, setSearchParams])

  const running = detail?.status === 'in_progress'
  const statusMeta = detail ? consoleStatusMeta(detail.status) : null

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: { colorPrimary: '#00b96b', borderRadius: 6, fontSize: 13 },
      }}
    >
      <style>{CONSOLE_SCOPE_CSS}</style>
      <div
        data-testid="console-workspace"
        className="tfai-console"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', background: '#141517', color: '#d9d9d9',
        }}
      >
        {/* 左侧任务流 */}
        {!sidebarCollapsed && (
          <div style={{
            width: 264, flexShrink: 0, background: '#1b1c1f',
            borderRight: '1px solid #2b2d31', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              height: 48, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', borderBottom: '1px solid #2b2d31',
            }}>
              <span style={{ color: '#fa8c16', fontSize: 15 }}>✻</span>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>工作台</span>
              <Tooltip title="返回管理页">
                <Button
                  size="small" type="text" icon={<LinkOutlined />}
                  onClick={() => navigate('/todo-for-ai/pages')}
                  title="返回管理页"
                />
              </Tooltip>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ConsoleSidebar
                tasks={tasks}
                selectedId={selectedId}
                onSelect={handleSelect}
                onCreated={handleCreated}
              />
            </div>
          </div>
        )}

        {/* 中间会话区 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 14px', borderBottom: '1px solid #2b2d31', background: '#1b1c1f',
          }}>
            <Button
              size="small" type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? '展开任务流' : '收起任务流'}
            />
            {detail ? (
              <>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#e8e8e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: '#595959', marginRight: 8 }}>#{detail.id}</span>
                  {detail.title}
                </span>
                {statusMeta && (
                  <Tag style={{ marginRight: 0, borderRadius: 4, color: statusMeta.color, borderColor: `${statusMeta.color}66` }}>
                    {detail.status === 'in_progress' && <span style={{ marginRight: 4 }}>⏵⏵</span>}
                    {statusMeta.label}
                  </Tag>
                )}
              </>
            ) : (
              <span style={{ color: '#666' }}>未选择任务</span>
            )}
            <div style={{ flex: 1 }} />
            <Tooltip title="刷新">
              <Button size="small" type="text" icon={<ReloadOutlined />} onClick={() => { loadTasks(); if (selectedId) loadDetail(selectedId) }} title="刷新" />
            </Tooltip>
            {detail && (
              <Tooltip title="在任务详情页打开">
                <Button
                  size="small" type="text" icon={<RightOutlined />}
                  onClick={() => navigate(`/todo-for-ai/pages/tasks/${detail.id}`)}
                  title="打开任务详情"
                />
              </Tooltip>
            )}
            <Button
              size="small" type="text" icon={<PlusOutlined />}
              onClick={() => setSidebarCollapsed(false)}
              title="新建任务（展开侧栏）"
            />
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Spin />
              </div>
            ) : detail ? (
              <ConsoleTranscript
                task={detail}
                running={running}
                onActivity={onSelectedEvent}
                onStopped={onSelectedEvent}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <div style={{ fontSize: 26, color: '#fa8c16' }}>✻</div>
                <div style={{ marginTop: 12, fontSize: 15 }}>Todo for AI 工作台</div>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  {tasks.length === 0 ? '还没有 AI 任务，从左侧「新任务」开始' : '从左侧选择一个任务开始协作'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧信息面板 */}
        {detail && !infoCollapsed && (
          <div style={{
            width: 300, flexShrink: 0, background: '#1b1c1f',
            borderLeft: '1px solid #2b2d31', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              height: 48, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', borderBottom: '1px solid #2b2d31',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>详情</span>
              <Button size="small" type="text" icon={<RightOutlined />} onClick={() => setInfoCollapsed(true)} title="收起详情" />
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ConsoleInfoPanel task={detail} />
            </div>
          </div>
        )}
        {detail && infoCollapsed && (
          <div style={{ width: 40, flexShrink: 0, background: '#1b1c1f', borderLeft: '1px solid #2b2d31', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button size="small" type="text" icon={<RightOutlined />} onClick={() => setInfoCollapsed(false)} title="展开详情" style={{ transform: 'rotate(180deg)' }} />
          </div>
        )}
      </div>
    </ConfigProvider>
  )
}

export default ConsoleWorkspace
