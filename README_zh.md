# Todo for AI 前端

**中文版本** | [English](README.md)

Todo for AI 任务管理系统的现代化 React 前端应用，使用 TypeScript、Vite 和 Ant Design 构建。

> 🚀 **立即体验**: 访问 [https://todo4ai.org/](https://todo4ai.org/) 体验我们的产品！

## ✨ 功能特性

- 🎨 **现代化 UI**: 基于 Ant Design 组件和响应式设计
- 🌐 **国际化**: 支持中英文双语
- 📱 **响应式设计**: 在桌面和移动设备上无缝运行
- 🔐 **身份认证**: Google 和 GitHub OAuth 集成
- 📊 **项目管理**: 完整的项目生命周期管理
- ✅ **任务管理**: 高级任务跟踪和看板视图
- 📝 **富文本编辑器**: Milkdown 驱动的 Markdown 编辑器，支持多种主题
- 🤖 **AI 集成**: 支持 MCP (模型上下文协议) 的 AI 助手
- 📈 **数据分析**: Google Analytics 4 集成用户行为追踪
- 🎯 **上下文规则**: 自定义提示和上下文管理
- 🔍 **高级搜索**: 强大的过滤和排序功能
- 🌙 **主题支持**: 多种主题包括打字机模式
- ⚡ **性能优化**: 使用 Vite 优化开发和构建速度

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Todo for AI API 服务器运行中

### 安装

1. **克隆仓库**
```bash
git clone https://github.com/todo-for-ai/todo-for-ai-webpage.git
cd todo-for-ai-webpage
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件配置您的设置
```

4. **启动开发服务器**
```bash
npm run dev
```

应用将在 `http://localhost:50111` 上运行

## 🔧 配置

### 环境变量

创建 `.env` 文件并配置以下变量：

```bash
# API 配置
VITE_API_BASE_URL=http://localhost:50110/todo-for-ai/api/v1
VITE_MCP_SERVER_URL=http://localhost:50110

# 应用配置
VITE_APP_TITLE="Todo for AI"
VITE_APP_VERSION="1.0.0"

# Google Analytics 配置
VITE_GA_ENABLED=true
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 开发配置
VITE_DEBUG_MODE=true
VITE_PERFORMANCE_MONITORING=false

# 功能开关
VITE_ENABLE_EXPERIMENTAL_FEATURES=false
VITE_ENABLE_ERROR_BOUNDARY=true

# 第三方服务
VITE_SENTRY_DSN=
VITE_HOTJAR_ID=
VITE_MIXPANEL_TOKEN=
```

### Google Analytics 设置

1. 创建 Google Analytics 4 属性
2. 获取您的测量 ID (格式: G-XXXXXXXXXX)
3. 在 `.env` 文件中设置 `VITE_GA_ENABLED=true` 和 `VITE_GA_MEASUREMENT_ID`

## 🏗️ 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **UI 库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router DOM 7
- **HTTP 客户端**: Axios
- **国际化**: i18next
- **富文本编辑器**: Milkdown
- **拖拽**: @dnd-kit
- **数据分析**: Google Analytics 4
- **代码质量**: ESLint + Prettier

## 📁 项目结构

```
todo-for-ai-webpage/
├── src/
│   ├── components/         # 可复用 UI 组件
│   │   ├── Layout/        # 应用布局组件
│   │   ├── AuthGuard/     # 身份认证守卫
│   │   └── ...
│   ├── pages/             # 页面组件
│   │   ├── Dashboard/     # 仪表板页面
│   │   ├── Projects/      # 项目管理
│   │   ├── Tasks/         # 任务管理
│   │   ├── Kanban/        # 看板视图
│   │   └── ...
│   ├── stores/            # Zustand 状态管理
│   │   ├── useAuthStore.ts
│   │   ├── useProjectStore.ts
│   │   └── ...
│   ├── services/          # API 服务
│   │   ├── api.ts         # API 客户端
│   │   ├── auth.ts        # 认证服务
│   │   └── ...
│   ├── contexts/          # React 上下文
│   │   ├── ThemeContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ...
│   ├── utils/             # 工具函数
│   ├── themes/            # 主题配置
│   ├── i18n/              # 国际化
│   └── types/             # TypeScript 类型定义
├── public/                # 静态资源
├── docs/                  # 文档
├── .env.example           # 环境变量模板
├── vite.config.ts         # Vite 配置
├── package.json           # 依赖和脚本
└── README.md             # 本文件
```

## 🎨 核心功能

### 仪表板
- 实时项目和任务统计
- 最近活动时间线
- 快速操作按钮
- 性能指标

### 项目管理
- 创建、编辑和删除项目
- 项目状态跟踪
- 团队协作功能
- 项目模板

### 任务管理
- 高级任务创建，支持丰富的元数据
- 任务状态工作流 (待办 → 进行中 → 审核 → 完成)
- 优先级和截止日期
- 任务分配和评论
- 批量操作

### 看板视图
- 拖拽式任务管理
- 可自定义列
- 实时更新
- 过滤和搜索

### 富文本编辑器
- Milkdown 驱动的 Markdown 编辑器
- 多种主题包括打字机模式
- 语法高亮
- 实时预览
- 导出功能

### 上下文规则和 AI 集成
- 自定义提示管理
- 上下文规则市场
- MCP 服务器集成
- AI 助手配置

## 🧪 开发

### 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build           # 生产构建
npm run build:no-check  # 跳过 TypeScript 检查的构建
npm run preview         # 预览生产构建
npm run lint            # 运行 ESLint

# 测试
npm run test            # 运行测试 (配置后)
npm run test:coverage   # 运行覆盖率测试
```

### 开发服务器

开发服务器包含：
- 热模块替换 (HMR)
- API 代理到后端服务器
- TypeScript 检查
- ESLint 集成

### 代码质量

- **ESLint**: 配置了 React 和 TypeScript 规则
- **Prettier**: 代码格式化
- **TypeScript**: 严格类型检查
- **Husky**: Git 钩子质量门禁 (配置后)

## 🚀 构建和部署

### 生产构建

```bash
npm run build
```

这会在 `dist/` 目录中创建优化的生产构建。

### Docker 部署

```bash
# 构建 Docker 镜像
docker build -t todo-for-ai-frontend:latest .

# 运行容器
docker run -d --name todo-for-ai-frontend \
  -p 80:80 \
  -e VITE_API_BASE_URL="https://your-api-domain.com/api/v1" \
  todo-for-ai-frontend:latest
```

### 环境特定构建

```bash
# 开发构建
VITE_API_BASE_URL=http://localhost:50110/todo-for-ai/api/v1 npm run build

# 生产构建
VITE_API_BASE_URL=https://todo4ai.org/todo-for-ai/api/v1 npm run build
```

## 🔍 故障排除

### 常见问题

1. **API 连接失败**
   - 检查 API 服务器是否运行
   - 验证 `.env` 中的 `VITE_API_BASE_URL`
   - 检查网络连接

2. **认证问题**
   - 确保 OAuth 配置正确
   - 检查浏览器控制台错误
   - 验证 API 服务器 OAuth 设置

3. **构建错误**
   - 清理并重新安装: `rm -rf node_modules package-lock.json && npm install`
   - 检查 TypeScript 错误: `npm run build`
   - 更新依赖: `npm update`

4. **性能问题**
   - 启用生产模式: `NODE_ENV=production`
   - 检查包大小: `npm run build` 并分析 `dist/` 文件夹
   - 优化图片和资源

### 调试模式

启用调试模式获取详细日志：

```bash
VITE_DEBUG_MODE=true npm run dev
```

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 进行更改
4. 运行测试和代码检查: `npm run lint`
5. 提交更改: `git commit -m 'Add amazing feature'`
6. 推送到分支: `git push origin feature/amazing-feature`
7. 创建 Pull Request

### 开发指南

- 遵循现有代码风格
- 为新功能添加 TypeScript 类型
- 为重要更改更新文档
- 彻底测试您的更改
- 保持组件小而专注

## 📄 许可证

MIT License

---

**🌟 准备提升您的生产力了吗？** 访问 [https://todo4ai.org/](https://todo4ai.org/) 体验 AI 驱动的任务管理的未来！
