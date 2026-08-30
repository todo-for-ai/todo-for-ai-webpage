import i18n from '../i18n'

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

type AppLanguage = 'zh-CN' | 'en'

const resolveLanguage = (language?: string): AppLanguage => {
  const raw = (language || i18n.language || 'zh-CN').toLowerCase()
  return raw.startsWith('zh') ? 'zh-CN' : 'en'
}

const getLocale = (language?: string): string => (
  resolveLanguage(language) === 'zh-CN' ? 'zh-CN' : 'en-US'
)

const tr = (key: string, defaultValue: string, options: Record<string, unknown> = {}, language?: string): string => {
  const value = i18n.t(key, {
    ...options,
    lng: resolveLanguage(language),
    defaultValue,
  })
  return typeof value === 'string' ? value : defaultValue
}

const variableLabelKeyMap: Record<string, string> = {
  'project.name': 'customPrompts:variables.project.name',
  'project.description': 'customPrompts:variables.project.description',
  'project.github_repo': 'customPrompts:variables.project.github_repo',
  'project.context': 'customPrompts:variables.project.context',
  'project.color': 'customPrompts:variables.project.color',
  'task.id': 'customPrompts:variables.task.id',
  'task.title': 'customPrompts:variables.task.title',
  'task.content': 'customPrompts:variables.task.content',
  'task.status': 'customPrompts:variables.task.status',
  'task.priority': 'customPrompts:variables.task.priority',
  'task.created_at': 'customPrompts:variables.task.created_at',
  'task.due_date': 'customPrompts:variables.task.due_date',
  'task.estimated_hours': 'customPrompts:variables.task.estimated_hours',
  'task.tags': 'customPrompts:variables.task.tags',
  'task.related_files': 'customPrompts:variables.task.related_files',
  'system.url': 'customPrompts:variables.system.url',
  'system.current_time': 'customPrompts:variables.system.current_time',
  'tasks.count': 'customPrompts:variables.tasks.count',
  'tasks.list': 'customPrompts:variables.tasks.list',
  'context_rules.global.all': 'customPrompts:variables.contextRules.global.all',
  'context_rules.global.count': 'customPrompts:variables.contextRules.global.count',
  'context_rules.global.names': 'customPrompts:variables.contextRules.global.names',
  'context_rules.project.all': 'customPrompts:variables.contextRules.project.all',
  'context_rules.project.count': 'customPrompts:variables.contextRules.project.count',
  'context_rules.project.names': 'customPrompts:variables.contextRules.project.names',
  'context_rules.merged.all': 'customPrompts:variables.contextRules.merged.all',
  'context_rules.merged.count': 'customPrompts:variables.contextRules.merged.count',
  'context_rules.merged.names': 'customPrompts:variables.contextRules.merged.names',
}

const getVariableLabel = (variable: string, fallback: string, language?: string): string => {
  const key = variableLabelKeyMap[variable]
  if (!key) return fallback
  return tr(key, fallback, {}, language)
}

const getMissingValueFallback = (variable: string, language?: string): string => {
  switch (variable) {
    case 'tasks.count':
    case 'context_rules.global.count':
    case 'context_rules.project.count':
    case 'context_rules.merged.count':
      return '0'
    case 'tasks.list':
      return tr('common:empty.noTasks', 'No tasks', {}, language)
    case 'context_rules.global.all':
    case 'context_rules.project.all':
    case 'context_rules.merged.all':
    case 'context_rules.global.names':
    case 'context_rules.project.names':
    case 'context_rules.merged.names':
      return tr('common:empty.noRules', 'No rules', {}, language)
    case 'system.url':
      return 'https://todo4ai.org'
    case 'system.current_time':
      return new Date().toLocaleString(getLocale(language))
    default:
      return getVariableLabel(variable, variable, language)
  }
}

const getNestedProperty = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((current: any, key: string) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj as any)
}

const renderContextRulesVariable = (contextRules: ContextRulesData, property: string): unknown => {
  const [scope, ...propertyPath] = property.split('.')
  const subProperty = propertyPath.join('.')

  switch (scope) {
    case 'global':
      return getNestedProperty(contextRules.global, subProperty)
    case 'project':
      return getNestedProperty(contextRules.project, subProperty)
    case 'merged':
      return getNestedProperty(contextRules.merged, subProperty)
    default:
      return getNestedProperty(contextRules.merged, property)
  }
}

export const formatTasksList = (tasks: TaskData[], language?: string): string => {
  return tasks.map((task, index) => {
    const priority = tr(`common:kanban.priority.${task.priority}`, task.priority, {}, language)
    return `${index + 1}. [${priority}] ${task.title} (ID: ${task.id})`
  }).join('\n')
}

export const formatDateTime = (dateString: string, language?: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString(getLocale(language), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

const renderVariable = (variable: string, context: RenderContext, language?: string): string => {
  const cleanVariable = variable.replace(/^\$\{|\}$/g, '')
  const [category, ...propertyPath] = cleanVariable.split('.')
  const property = propertyPath.join('.')

  let value: unknown
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
      return variable
  }

  if (value !== undefined) {
    if (property.includes('_at') || property === 'due_date') {
      return formatDateTime(String(value), language)
    }

    if (Array.isArray(value)) {
      if (property === 'related_files') {
        return value.join('\n')
      }
      return value.join(', ')
    }

    if (typeof value === 'boolean') {
      return value
        ? tr('common:boolean.true', 'Yes', {}, language)
        : tr('common:boolean.false', 'No', {}, language)
    }

    if (typeof value === 'number') {
      return value.toString()
    }

    return String(value)
  }

  const fallback = getMissingValueFallback(cleanVariable, language)
  return fallback || `[${cleanVariable}]`
}

export const renderPromptTemplate = (template: string, context: RenderContext): string => {
  const language = resolveLanguage()
  const variableRegex = /\$\{[^}]+\}/g
  return template.replace(variableRegex, (match) => renderVariable(match, context, language))
}

export const extractVariables = (template: string): string[] => {
  const variableRegex = /\$\{([^}]+)\}/g
  const variables: string[] = []
  let match: RegExpExecArray | null

  while ((match = variableRegex.exec(template)) !== null) {
    variables.push(match[1])
  }

  return [...new Set(variables)]
}

export const validateVariable = (variable: string): boolean => {
  const validCategories = ['project', 'task', 'system', 'tasks', 'context_rules']
  const [category] = variable.split('.')
  return validCategories.includes(category)
}

export const getVariableDescription = (variable: string): string => {
  return getVariableLabel(variable, variable)
}

export const buildContextRulesData = (
  globalRules: ContextRuleData[] = [],
  projectRules: ContextRuleData[] = []
): ContextRulesData => {
  const globalData = {
    all: globalRules.map(rule => `### ${rule.name}\n${rule.content}`).join('\n\n'),
    count: globalRules.length,
    names: globalRules.map(rule => rule.name),
    rules: globalRules,
    by_name: globalRules.reduce((acc, rule) => {
      acc[rule.name] = rule.content
      return acc
    }, {} as Record<string, string>),
  }

  const projectData = {
    all: projectRules.map(rule => `### ${rule.name}\n${rule.content}`).join('\n\n'),
    count: projectRules.length,
    names: projectRules.map(rule => rule.name),
    rules: projectRules,
    by_name: projectRules.reduce((acc, rule) => {
      acc[rule.name] = rule.content
      return acc
    }, {} as Record<string, string>),
  }

  const mergedRules = [...globalRules, ...projectRules].sort((a, b) => b.priority - a.priority)
  const mergedData = {
    all: mergedRules.map(rule => `### ${rule.name}\n${rule.content}`).join('\n\n'),
    count: mergedRules.length,
    names: mergedRules.map(rule => rule.name),
    rules: mergedRules,
    by_name: mergedRules.reduce((acc, rule) => {
      acc[rule.name] = rule.content
      return acc
    }, {} as Record<string, string>),
  }

  return {
    global: globalData,
    project: projectData,
    merged: mergedData,
  }
}
