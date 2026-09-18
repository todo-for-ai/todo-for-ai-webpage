# 前端代码组织约定

> 适用仓库：todo-for-ai-webpage。2026-09-18 起生效；新代码按此组织，改动到哪片就顺手捋顺哪片。

## 总原则

1. **单文件行数硬上限 500 行，新增文件目标 ≤300 行**。超过即拆：数据进 hook、视图进子组件、类型进独立文件。
2. **页面 = 壳 + 聚簇**。`src/pages/Xxx.tsx` 只做路由级组装（目标 ≤150 行）；其余全部进 `src/pages/<feature>/` 聚簇目录。
3. **共享组件进 `src/components/<Name>/`，页面私有组件一律放页面聚簇内**，禁止为单页面组件建顶层共享目录。

## 目录结构

```
src/
├── api/<domain>/          # API 客户端按域拆分：workflow-methods.ts / workflow-types.ts …
├── components/<Name>/     # 跨页面复用组件；大组件再拆 hooks/ utils/ 子目录
├── hooks/                 # 跨页面复用 hook（useCollaborationSSE 等）
├── pages/
│   ├── Xxx.tsx            # 路由壳：只组装，不写业务
│   └── <feature>/         # 页面聚簇：组件、hook、私有弹窗、共享小模块
│       ├── components/    #   区块组件
│       ├── hooks/         #   领域 hook（每个 hook 管一个域）
│       └── runStatus.tsx  #   页内共享的常量/映射（如状态色表）
├── stores/                # zustand store
└── utils/                 # 纯函数工具
```

实例：`pages/agents/`（agents 页聚簇）、`pages/workflows/`、`pages/dashboard/`、`components/Workflow/canvas/`（工作流画布编辑器集群：模型 flowModel/canvasModel、节点、配置面板、编辑器、运行态画布）。

## 组合根模式（大型接线页）

状态域多、区块组件多的页面（如 Agents）不逐 prop 透传，用**组合根 hook** 收敛：

- `pages/<feature>/use<X>Page.ts`：调用全部领域 hook + 局部状态 + URL 联动 + 派生处理器，返回一个扁平对象（`AgentsPageContext = ReturnType<typeof useAgentsPage>`）。
- 页面壳只做 `const page = useAgentsPage()` 然后 `<Section {...page} />` 展开注入。
- 视图区块的 props 类型直接取 ctx 子集/全量（`agentsViewProps.ts`），禁止再手写 `any` 大接口。
- 领域 hook 之间需要实时跨域读取时用 **getter 注入**（如 dispatch 面板的 `get loadInbox()`），不要提前解构造成闭包过期。

## 画布编辑器集群（components/Workflow/canvas/）

- `steps` 数组是唯一数据源：节点/边全部派生（`stepsToFlow`），坐标回写 steps，保存时把布局写进 `definition.layout` 随版本快照留存。
- 新建与编辑共用 `WorkflowCanvasEditor`：`WorkflowCanvasModal` 的 `createMode=true` 走 POST 创建；未落库的工作流不注入 `onTestRun`。
- 运行态画布 `WorkflowRunCanvas` 是自绘只读实现——**不要改回 React Flow 受控边**（RF v12 受控边有状态有、DOM 无的不渲染坑，见记忆 todo-for-ai-workflow-loop-canvas）。

## 命名与去重

- 聚簇目录统一 **kebab-case**（`command-center/`），禁止同一聚簇出现两种大小写双目录（2026-09-18 已合并 `commandCenter` → `command-center`）。
- 同一常量/映射只允许一处定义（如 `runStatus.tsx` 的 STEP_STATUS_MAP / WORKFLOW_STATUS_COLORS），新用法 import，不复制。
- 抽出的组件必须真正接线使用；发现“import 了没用”的死导入即删（本轮清掉 TriggerCreationModal / LaunchWorkflowModal 抽而未用的历史遗留）。

## UI 红线（仓库 AGENTS.md 同步约束）

- 不用大圆角：卡片/标签/容器圆角 ≤8px。
- 主色禁用紫系；高亮/状态用蓝/青/绿/橙/中性色。
