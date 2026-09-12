# 前端拆解路线图（300–500 行/文件约定）

> 目标：全部源文件进入 300–500 行区间。方法：领域块原样搬移为 hook/子组件，tsc+vitest+build 门禁全绿后合并。约定：不删码、逐锚点断言、失败即回滚。

## 台账（>500 行，2026-09-12 基线）

| 文件 | 行数 | 切法 |
|---|---|---|
| pages/Agents.tsx | 1706 | 已切 5 块（sandbox/channels-chat/collab-knowledge/intelligence/inbox-DM-recTasks）。剩余：dispatch 函数族→见下方案；direct-message/recommended UI→子组件；渲染骨架按面板拆 |
| pages/dashboard/AgentAnalyticsSection.tsx | 1616 | 按图表卡片拆子组件（每卡一文件） |
| pages/Dashboard.tsx | 1409 | 按 Section 拆（对齐 AgentAnalytics/TaskAnalytics 既有模式） |
| pages/OrganizationDetail.tsx | 1257 | 按 Tab 拆子组件 |
| pages/CommandCenter.tsx | 961 | 按面板拆 hook+子组件 |
| pages/Workflows.tsx | 843 | 列表/编辑器/运行台三块 |
| pages/components/TaskDetail/TaskCollaborationTimeline.tsx | 767 | 时间线项子组件 |
| components/CollaborationGraphView.tsx | 713 | 力导向布局工具抽 utils |
| api/agents/index.ts | 613 | 分域 re-export 聚合（已分域，可拆聚合层） |
| api/tasks.ts | 606 | types/方法两文件 |
| api/agents/types.ts | 605 | core/ workspace/ automation 三段 |
| pages/Profile.tsx | 594 | 表单区/安全区拆 |
| pages/dashboard/TaskAnalyticsSection.tsx | 575 | 同 Analytics 模式 |
| pages/agents/modals/SandboxDrawer.tsx | 554 | 表单段抽 hook |
| api/agents/analytics-types.ts | 546 | 类型分域 |
| pages/dashboard/ExperiencesSection.tsx | 529 | 图表段抽 |
| pages/agents/AgentsPage.tsx | 512 | 新版页面，微调即可 |
| pages/agents/components/detailTabs/AgentRuntimeTab.tsx | 505 | 边界情况 |

## dispatch 函数族方案（迭代 60 定稿）

1. 抽 `useAgentCoreState`：selectedAgent/agents/drawerOpen/drawerAgent/assignmentLoading 等**共享状态层**
2. `useAgentDispatchPanel(ctx)` 收显式 ctx 对象（含上述共享状态 + loaders + form）
3. 解构位置：组件最前（状态层之后、其它 hook 之前）
4. 禁止：领域 hook 吞掉共享状态（迭代 60 失败根因）

## 方法论

- 函数段边界 = 起始行下滑至恰等 `"  }"`；状态行 = 变量名+实测行号双断言
- 块内 useState 与函数交错时，按 setter 名单反推状态名，块内内联者保持内联
- 跨域数据直传、跨域回调闭包惰性（`() => fn`）
- 门禁：`npx tsc -b` 0 错 → `npm test` → `npm run build`
