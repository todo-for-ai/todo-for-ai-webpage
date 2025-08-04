/**
 * 提示词变量渲染工具
 * 支持 ${variable.property} 格式的变量替换
 */

export interface ProjectData {
  id: number
  name: string
  description: string
  github_repo?: string
  context?: string
  color?: string
  status: string
  created_at: string
  updated_at: string
}

export interface TaskData {
  id: number
  title: string
  content: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  due_date?: string
  estimated_hours?: number
  tags: string[]
  related_files?: string[]
  assignee?: string
  project_id: number
}

export interface SystemData {
  url: string
  current_time: string
  version?: string
}

export interface TasksListData {
  count: number
  list: string
  pending_count: number
  in_progress_count: number
  review_count: number
}

export interface ContextRuleData {
  id: number
  name: string
  description: string
  content: string
  priority: number
  is_active: boolean
  is_global: boolean
  project_id?: number
}

export interface ContextRulesData {
  global: {
    all: string
    count: number
    names: string[]
    rules: ContextRuleData[]
    by_name: Record<string, string>
  }
  project: {
    all: string
    count: number
    names: string[]
    rules: ContextRuleData[]
    by_name: Record<string, string>
  }
  merged: {
    all: string
    count: number
    names: string[]
    rules: ContextRuleData[]
    by_name: Record<string, string>
  }
}

export interface RenderContext {
  project?: ProjectData
  task?: TaskData
  system?: SystemData
  tasks?: TasksListData
  context_rules?: ContextRulesData
}

/**
 * 格式化任务列表为字符串
 */
export const formatTasksList = (tasks: TaskData[]): string => {
  return tasks.map((task, index) => {
    const priorityMap: Record<string, string> = {
      'high': '高',
      'medium': '中', 
      'low': '低',
      'urgent': '紧急'
    }
    
    const priority = priorityMap[task.priority] || task.priority
    return `${index + 1}. [${priority}] ${task.title} (ID: ${task.id})`
  }).join('\n')
}

/**
 * 格式化时间
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

/**
 * 安全地获取嵌套对象属性
 */
const getNestedProperty = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * 渲染上下文规则变量
 */
const renderContextRulesVariable = (contextRules: ContextRulesData, property: string): any => {
  const [scope, ...propertyPath] = property.split('.')
  const subProperty = propertyPath.join('.')

  // 处理不同的作用域
  switch (scope) {
    case 'global':
      return getNestedProperty(contextRules.global, subProperty)

    case 'project':
      return getNestedProperty(contextRules.project, subProperty)

    case 'merged':
      return getNestedProperty(contextRules.merged, subProperty)

    default:
      // 如果没有指定作用域，默认返回合并的规则
      return getNestedProperty(contextRules.merged, property)
  }
}

/**
 * 渲染单个变量
 */
const renderVariable = (variable: string, context: RenderContext): string => {
  // 移除 ${} 包装
  const cleanVariable = variable.replace(/^\$\{|\}$/g, '')
  
  // 解析变量路径
  const [category, ...propertyPath] = cleanVariable.split('.')
  const property = propertyPath.join('.')
  
  let value: any
  
  switch (category) {
    case 'project':
      value = context.project ? getNestedProperty(context.project, property) : undefined
      break

    case 'task':
      value = context.task ? getNestedProperty(context.task, property) : undefined
      break

    case 'system':
      value = context.system ? getNestedProperty(context.system, property) : undefined
      break

    case 'tasks':
      value = context.tasks ? getNestedProperty(context.tasks, property) : undefined
      break

    case 'context_rules':
      value = context.context_rules ? renderContextRulesVariable(context.context_rules, property) : undefined
      break

    default:
      return variable // 返回原始变量如果无法识别
  }
  
  // 处理特殊格式化
  if (value !== undefined) {
    // 时间格式化
    if (property.includes('_at') || property === 'due_date') {
      return formatDateTime(value)
    }
    
    // 数组格式化
    if (Array.isArray(value)) {
      if (property === 'tags') {
        return value.join(', ')
      }
      if (property === 'related_files') {
        return value.join('\n')
      }
      return value.join(', ')
    }
    
    // 布尔值格式化
    if (typeof value === 'boolean') {
      return value ? '是' : '否'
    }
    
    // 数字格式化
    if (typeof value === 'number') {
      return value.toString()
    }
    
    // 字符串或其他类型
    return String(value)
  }
  
  // 如果值不存在，返回占位符
  const placeholders: Record<string, string> = {
    'project.name': '项目名称',
    'project.description': '项目描述',
    'project.github_repo': 'GitHub仓库',
    'project.context': '项目上下文',
    'task.title': '任务标题',
    'task.content': '任务内容',
    'task.status': '任务状态',
    'task.priority': '优先级',
    'tasks.count': '0',
    'tasks.list': '暂无任务',
    'system.url': 'https://todo4ai.org',
    'system.current_time': new Date().toLocaleString('zh-CN'),
    'context_rules.global.all': '暂无全局规则',
    'context_rules.global.count': '0',
    'context_rules.global.names': '暂无规则',
    'context_rules.project.all': '暂无项目规则',
    'context_rules.project.count': '0',
    'context_rules.project.names': '暂无规则',
    'context_rules.merged.all': '暂无规则',
    'context_rules.merged.count': '0',
    'context_rules.merged.names': '暂无规则'
  }
  
  return placeholders[cleanVariable] || `[${cleanVariable}]`
}

/**
 * 渲染提示词模板
 * @param template 包含变量的模板字符串
 * @param context 渲染上下文数据
 * @returns 渲染后的字符串
 */
export const renderPromptTemplate = (template: string, context: RenderContext): string => {
  // 匹配 ${variable.property} 格式的变量
  const variableRegex = /\$\{[^}]+\}/g
  
  return template.replace(variableRegex, (match) => {
    return renderVariable(match, context)
  })
}

/**
 * 获取模板中使用的所有变量
 */
export const extractVariables = (template: string): string[] => {
  const variableRegex = /\$\{([^}]+)\}/g
  const variables: string[] = []
  let match
  
  while ((match = variableRegex.exec(template)) !== null) {
    variables.push(match[1])
  }
  
  return [...new Set(variables)] // 去重
}

/**
 * 验证变量是否有效
 */
export const validateVariable = (variable: string): boolean => {
  const validCategories = ['project', 'task', 'system', 'tasks', 'context_rules']
  const [category] = variable.split('.')
  return validCategories.includes(category)
}

/**
 * 获取变量的描述信息
 */
export const getVariableDescription = (variable: string): string => {
  const descriptions: Record<string, string> = {
    'project.name': '项目名称',
    'project.description': '项目描述',
    'project.github_repo': 'GitHub仓库地址',
    'project.context': '项目上下文信息',
    'project.color': '项目颜色',
    'project.status': '项目状态',
    'project.created_at': '项目创建时间',
    'project.updated_at': '项目更新时间',
    
    'task.id': '任务ID',
    'task.title': '任务标题',
    'task.content': '任务内容',
    'task.status': '任务状态',
    'task.priority': '任务优先级',
    'task.created_at': '任务创建时间',
    'task.updated_at': '任务更新时间',
    'task.due_date': '任务截止时间',
    'task.estimated_hours': '预估工时',
    'task.tags': '任务标签',
    'task.related_files': '相关文件',
    'task.assignee': '任务负责人',
    
    'system.url': '系统URL地址',
    'system.current_time': '当前时间',
    'system.version': '系统版本',
    
    'tasks.count': '任务总数',
    'tasks.list': '任务列表',
    'tasks.pending_count': '待处理任务数',
    'tasks.in_progress_count': '进行中任务数',
    'tasks.review_count': '待审核任务数',

    'context_rules.global.all': '所有全局上下文规则的内容',
    'context_rules.global.count': '全局上下文规则数量',
    'context_rules.global.names': '全局上下文规则名称列表',
    'context_rules.project.all': '当前项目所有上下文规则的内容',
    'context_rules.project.count': '项目上下文规则数量',
    'context_rules.project.names': '项目上下文规则名称列表',
    'context_rules.merged.all': '全局和项目规则合并后的内容',
    'context_rules.merged.count': '合并后的规则总数',
    'context_rules.merged.names': '合并后的规则名称列表'
  }

  return descriptions[variable] || variable
}

/**
 * 构建上下文规则数据
 */
export const buildContextRulesData = (
  globalRules: ContextRuleData[] = [],
  projectRules: ContextRuleData[] = []
): ContextRulesData => {
  // 构建全局规则数据
  const globalData = {
    all: globalRules.map(rule => `### ${rule.name}\n${rule.content}`).join('\n\n'),
    count: globalRules.length,
    names: globalRules.map(rule => rule.name),
    rules: globalRules,
    by_name: globalRules.reduce((acc, rule) => {
      acc[rule.name] = rule.content
      return acc
    }, {} as Record<string, string>)
  }

  // 构建项目规则数据
  const projectData = {
    all: projectRules.map(rule => `### ${rule.name}\n${rule.content}`).join('\n\n'),
    count: projectRules.length,
    names: projectRules.map(rule => rule.name),
    rules: projectRules,
    by_name: projectRules.reduce((acc, rule) => {
      acc[rule.name] = rule.content
      return acc
    }, {} as Record<string, string>)
  }

  // 构建合并规则数据（全局规则优先级较低，项目规则优先级较高）
  const mergedRules = [...globalRules, ...projectRules].sort((a, b) => b.priority - a.priority)
  const mergedData = {
    all: mergedRules.map(rule => `### ${rule.name}\n${rule.content}`).join('\n\n'),
    count: mergedRules.length,
    names: mergedRules.map(rule => rule.name),
    rules: mergedRules,
    by_name: mergedRules.reduce((acc, rule) => {
      // 如果有重名规则，项目规则会覆盖全局规则
      acc[rule.name] = rule.content
      return acc
    }, {} as Record<string, string>)
  }

  return {
    global: globalData,
    project: projectData,
    merged: mergedData
  }
}
