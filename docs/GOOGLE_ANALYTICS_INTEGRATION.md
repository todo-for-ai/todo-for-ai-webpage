# Google Analytics 4 集成文档

## 概述

本项目已集成 Google Analytics 4 (GA4) 用于网站数据分析和用户行为追踪。GA4 提供了强大的分析功能，帮助我们了解用户如何使用我们的应用。

## 功能特性

### 🔍 自动追踪
- **页面浏览**: 自动追踪所有页面访问
- **路由变化**: SPA 路由切换自动记录
- **用户会话**: 自动记录用户会话信息

### 📊 业务事件追踪
- **用户认证**: 登录、注册、登出事件
- **项目管理**: 项目创建、查看、编辑、删除
- **任务管理**: 任务创建、查看、编辑、状态变更、完成
- **功能使用**: Kanban、MCP、上下文规则、自定义提示等功能使用
- **社交互动**: 微信群、Telegram群加入事件
- **设置变更**: 语言切换、主题变更等
- **错误追踪**: API错误、JavaScript错误

### 🛡️ 隐私保护
- **可配置启用/禁用**: 通过环境变量控制
- **调试模式**: 开发环境下提供详细日志
- **安全实现**: 遵循最佳实践，保护用户隐私

## 配置说明

### 环境变量

在 `.env` 文件中配置以下变量：

```bash
# 是否启用 Google Analytics (true/false)
VITE_GA_ENABLED=true

# Google Analytics 4 测量ID
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 获取 GA4 测量ID

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 创建新的 GA4 属性
3. 在"数据流"中添加网站
4. 复制测量ID (格式: G-XXXXXXXXXX)
5. 将测量ID设置到环境变量中

## 使用方法

### 基础追踪

```typescript
import { analytics, trackEvent, trackPageView } from '../utils/analytics'

// 手动追踪页面浏览
trackPageView('/custom-page', 'Custom Page Title')

// 追踪自定义事件
trackEvent('custom_event', {
  event_category: 'user_interaction',
  event_label: 'button_click',
  value: 1
})
```

### 业务事件追踪

```typescript
// 用户认证
analytics.auth.login('github')
analytics.auth.logout()
analytics.auth.register('email')

// 项目管理
analytics.project.create('project-123')
analytics.project.view('project-123')
analytics.project.edit('project-123')
analytics.project.delete('project-123')

// 任务管理
analytics.task.create('task-456', 'project-123')
analytics.task.view('task-456', 'project-123')
analytics.task.statusChange('task-456', 'todo', 'done')
analytics.task.complete('task-456', 'project-123')

// 功能使用
analytics.feature.useKanban()
analytics.feature.useMCP()
analytics.feature.downloadMCP()

// 社交互动
analytics.social.joinWeChatGroup()
analytics.social.joinTelegramGroup()

// 设置变更
analytics.settings.changeLanguage('en')
analytics.settings.changeTheme('dark')

// 错误追踪
analytics.error.apiError('/api/tasks', 500)
analytics.error.jsError('TypeError: Cannot read property', 'TaskDetail.tsx')
```

### React Hook

```typescript
import { usePageTracking } from '../hooks/usePageTracking'

function MyComponent() {
  // 自动追踪页面浏览
  usePageTracking()
  
  return <div>My Component</div>
}
```

## 事件结构

### 标准事件参数

所有事件都包含以下标准参数：
- `event_category`: 事件分类
- `event_label`: 事件标签（可选）
- `value`: 数值（可选）

### 自定义参数

根据业务需求，不同事件包含特定参数：
- `project_id`: 项目ID
- `task_id`: 任务ID
- `method`: 认证方法
- `from_status`: 原状态
- `to_status`: 新状态
- `language`: 语言代码
- `theme`: 主题名称
- `endpoint`: API端点
- `status_code`: HTTP状态码
- `error_message`: 错误信息

## 数据分析

### 关键指标

在 GA4 中可以分析以下关键指标：

1. **用户参与度**
   - 页面浏览量
   - 会话时长
   - 跳出率
   - 用户留存

2. **功能使用情况**
   - 各功能使用频率
   - 用户流程分析
   - 转化漏斗

3. **用户行为**
   - 最受欢迎的功能
   - 用户操作路径
   - 错误发生频率

4. **技术指标**
   - 页面加载性能
   - 错误率统计
   - 设备和浏览器分布

### 自定义报告

可以在 GA4 中创建自定义报告：

1. **项目管理报告**: 项目创建、编辑、删除趋势
2. **任务管理报告**: 任务完成率、状态变更分析
3. **功能使用报告**: 各功能模块使用情况
4. **错误监控报告**: 错误类型和频率分析

## 开发指南

### 添加新事件

1. 在 `analytics.ts` 中定义新的事件函数
2. 在相应组件中调用事件追踪
3. 更新本文档

示例：
```typescript
// 在 analytics.ts 中添加
export const analytics = {
  // ... 现有事件
  newFeature: {
    use: (featureId: string) => {
      trackEvent('use_new_feature', {
        event_category: 'feature',
        feature_id: featureId,
      })
    },
  },
}

// 在组件中使用
import { analytics } from '../utils/analytics'

const handleUseFeature = () => {
  analytics.newFeature.use('awesome-feature')
  // ... 其他逻辑
}
```

### 调试

开发环境下，所有 GA 事件都会在控制台输出详细日志：

```
[GA] Event tracked: { eventName: 'login', parameters: { event_category: 'authentication', method: 'github' } }
[GA] Page view tracked: { path: '/projects/123', title: 'Project Detail' }
```

### 测试

1. 设置测试环境的 GA4 属性
2. 使用 GA4 实时报告验证事件
3. 检查控制台日志确认事件发送

## 部署配置

### Docker 构建

在构建 Docker 镜像时传入 GA 配置：

```bash
docker build \
  --build-arg VITE_GA_ENABLED=true \
  --build-arg VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  -t todo-for-ai-frontend .
```

### 环境变量

生产环境中确保设置正确的环境变量：

```bash
export VITE_GA_ENABLED=true
export VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 隐私合规

### GDPR 合规

- 用户可以通过环境变量禁用 GA
- 不收集个人身份信息 (PII)
- 遵循数据最小化原则

### 数据保留

- GA4 默认数据保留期为 14 个月
- 可在 GA4 设置中调整保留期
- 定期审查和清理不必要的数据

## 故障排除

### 常见问题

1. **事件未显示在 GA4 中**
   - 检查测量ID是否正确
   - 确认 GA4 脚本已加载
   - 查看浏览器控制台错误

2. **页面浏览未追踪**
   - 确认 `usePageTracking` Hook 已使用
   - 检查路由配置
   - 验证 SPA 配置

3. **调试信息未显示**
   - 确认在开发环境
   - 检查 `DEBUG_MODE` 配置
   - 查看控制台过滤设置

### 联系支持

如有问题，请：
1. 查看浏览器控制台错误
2. 检查网络请求
3. 提供详细的错误信息和复现步骤

## 更新日志

### v1.0.0 (2025-08-03)
- ✅ 初始 GA4 集成
- ✅ 页面浏览自动追踪
- ✅ 业务事件追踪
- ✅ React Hook 支持
- ✅ 环境变量配置
- ✅ Docker 支持
- ✅ 调试模式
- ✅ 隐私保护
