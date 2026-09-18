import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ConfigProvider, Spin, Tag, Tooltip, theme as antdTheme } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  RightOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { useConsoleTasks } from '../../hooks/useConsoleTasks'
import ConsoleSidebar from './ConsoleSidebar'
import ConsoleTranscript from './ConsoleTranscript'
import ConsoleInfoPanel from './ConsoleInfoPanel'
import ConsoleQuickSwitcher from './ConsoleQuickSwitcher'
import ConsoleShortcutsOverlay from './ConsoleShortcutsOverlay'
import { consoleStatusMeta } from './consoleData'
import { CONSOLE_TOKENS, CONSOLE_SCOPE_CSS, CONSOLE_POP_CSS } from './consoleTheme'

/**
 * 全屏 Web 工作台（对标 AI 编程工具的远程控制台界面）：
 * 左侧任务流 + 中间会话时间线 + 右侧信息面板。
 * 深色、无管理侧边栏；路由 /todo-for-ai/pages/console（AuthGuard 内、AppLayout 外）。
 * 数据装配在 useConsoleTasks，本组件只管布局与交互。
 */
export const ConsoleWorkspace: React.FC = () => {
  const navigate = useNavigate()
  const {
    tasks, detail, loading, selectedId,
    handleSelect, handleCreated, onSelectedEvent, refresh,
  } = useConsoleTasks()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [infoCollapsed, setInfoCollapsed] = useState(false)
  /** ⌘K / Ctrl+K 快速任务切换 */
  const [switcherOpen, setSwitcherOpen] = useState(false)
  /** ? 快捷键帮助浮层 */
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setSwitcherOpen(v => !v)
        return
      }
      // 快捷键帮助：? 唤起 / Esc 关闭（输入框中的 ? 不触发）
      const target = e.target as HTMLElement | null
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (!typing && (e.key === '?' || (shortcutsOpen && e.key === 'Escape'))) {
        e.preventDefault()
        setShortcutsOpen(v => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shortcutsOpen])

  const running = detail?.status === 'in_progress'
  const statusMeta = detail ? consoleStatusMeta(detail.status) : null

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: { colorPrimary: CONSOLE_TOKENS.accent, borderRadius: 6, fontSize: 13 },
      }}
    >
      <style>{CONSOLE_SCOPE_CSS}</style>
      <style>{CONSOLE_POP_CSS}</style>
      <div
        data-testid="console-workspace"
        className="tfai-console"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', background: CONSOLE_TOKENS.bgPage, color: CONSOLE_TOKENS.textBody,
        }}
      >
        {/* 左侧任务流 */}
        {!sidebarCollapsed && (
          <div style={{
            width: 264, flexShrink: 0, background: CONSOLE_TOKENS.bgPanel,
            borderRight: `1px solid ${CONSOLE_TOKENS.border}`, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              height: 48, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', borderBottom: `1px solid ${CONSOLE_TOKENS.border}`,
            }}>
              <span style={{ color: CONSOLE_TOKENS.orange, fontSize: 15 }}>✻</span>
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
            padding: '0 14px', borderBottom: `1px solid ${CONSOLE_TOKENS.border}`, background: CONSOLE_TOKENS.bgPanel,
          }}>
            <Button
              size="small" type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? '展开任务流' : '收起任务流'}
            />
            {detail ? (
              <>
                <span style={{ fontWeight: 600, fontSize: 14, color: CONSOLE_TOKENS.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: CONSOLE_TOKENS.textGhost, marginRight: 8 }}>#{detail.id}</span>
                  {detail.title}
                </span>
                {statusMeta && (
                  <Tag style={{ marginRight: 0, borderRadius: 4, color: statusMeta.color, borderColor: `${statusMeta.color}66` }}>
                    {running && (
                      <span
                        className="tfai-pulse-dot"
                        style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusMeta.color, marginRight: 6 }}
                      />
                    )}
                    {running && <span style={{ marginRight: 4 }}>⏵⏵</span>}
                    {statusMeta.label}
                  </Tag>
                )}
              </>
            ) : (
              <span style={{ color: CONSOLE_TOKENS.textFaint }}>未选择任务</span>
            )}
            <div style={{ flex: 1 }} />
            <Tooltip title="搜索任务（⌘K）">
              <Button size="small" type="text" icon={<SearchOutlined />} onClick={() => setSwitcherOpen(true)} title="搜索任务（⌘K）" />
            </Tooltip>
            <Tooltip title="键盘快捷键（?）">
              <Button
                size="small" type="text" icon={<QuestionCircleOutlined />}
                onClick={() => setShortcutsOpen(v => !v)}
                title="键盘快捷键（?）"
                data-testid="console-shortcuts-button"
              />
            </Tooltip>
            <Tooltip title="刷新">
              <Button size="small" type="text" icon={<ReloadOutlined />} onClick={refresh} title="刷新" />
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
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: CONSOLE_TOKENS.textFaint }}>
                <div style={{ fontSize: 26, color: CONSOLE_TOKENS.orange }}>✻</div>
                <div style={{ marginTop: 12, fontSize: 15 }}>Todo for AI 工作台</div>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  {tasks.length === 0 ? '还没有 AI 任务，从左侧「新任务」开始' : '从左侧选择一个任务开始协作'}
                </div>
              </div>
            )}
          </div>
        </div>

        <ConsoleQuickSwitcher
          open={switcherOpen}
          tasks={tasks}
          onClose={() => setSwitcherOpen(false)}
          onSelect={handleSelect}
        />

        <ConsoleShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        {/* 右侧信息面板 */}
        {detail && !infoCollapsed && (
          <div style={{
            width: 300, flexShrink: 0, background: CONSOLE_TOKENS.bgPanel,
            borderLeft: `1px solid ${CONSOLE_TOKENS.border}`, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              height: 48, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', borderBottom: `1px solid ${CONSOLE_TOKENS.border}`,
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
          <div style={{ width: 40, flexShrink: 0, background: CONSOLE_TOKENS.bgPanel, borderLeft: `1px solid ${CONSOLE_TOKENS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button size="small" type="text" icon={<RightOutlined />} onClick={() => setInfoCollapsed(false)} title="展开详情" style={{ transform: 'rotate(180deg)' }} />
          </div>
        )}
      </div>
    </ConfigProvider>
  )
}

export default ConsoleWorkspace
