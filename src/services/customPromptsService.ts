/**
 * 自定义提示词服务
 * 管理用户的自定义提示词模板和任务详情页按钮配置
 */

import { renderPromptTemplate, type RenderContext, formatTasksList } from '../utils/promptRenderer'
import { customPromptsApi } from '../api/customPrompts'
import i18n from '../i18n'

export interface TaskPromptButton {
  id: string
  name: string
  content: string
  order: number
}

export interface CustomPromptsConfig {
  projectPromptTemplate: string
  taskPromptButtons: TaskPromptButton[]
}

// 默认的项目提示词模板
const DEFAULT_PROJECT_TEMPLATE = `请帮我执行项目"\${project.name}"中的所有待办任务：

**项目信息**:
- 项目名称: \${project.name}
- 项目描述: \${project.description}
- GitHub仓库: \${project.github_repo}
- 项目上下文: \${project.context}

**待执行任务数量**: \${tasks.count}个

**执行指引**:
1. 请使用MCP工具连接到Todo系统: \${system.url}
2. 使用get_project_tasks_by_name工具获取项目任务列表:
   - 项目名称: "\${project.name}"
   - 状态筛选: ["todo", "in_progress", "review"]
3. 按照任务的创建时间顺序，逐个执行任务
4. 对于每个任务，使用get_task_by_id获取详细信息
5. 完成任务后，使用submit_task_feedback提交反馈
6. 继续执行下一个任务，直到所有任务完成

**任务概览**:
\${tasks.list}

请开始执行这个项目的任务，并在每个任务完成后提交反馈。`

// 根据语言获取默认任务提示词按钮
const getDefaultTaskButtons = (language?: string): TaskPromptButton[] => {
  const currentLanguage = language || i18n.language || 'zh-CN'
  
  if (currentLanguage === 'en') {
    return [
      {
        id: 'mcp-execution',
        name: 'MCP Execution',
        content: `Please use the todo-for-ai MCP tool to get detailed information for task ID \${task.id}, then execute this task and submit a task feedback report upon completion.`,
        order: 1
      }
    ]
  } else {
    // 默认中文按钮
    return [
      {
        id: 'mcp-execution',
        name: 'MCP执行',
        content: `请使用todo-for-ai MCP工具获取任务ID为\${task.id}的详细信息，然后执行这个任务，完成后提交任务反馈报告。`,
        order: 1
      }
    ]
  }
}

class CustomPromptsService {
  private static instance: CustomPromptsService
  private config: CustomPromptsConfig
  private isLoaded: boolean = false

  private constructor() {
    this.config = this.loadConfig()
  }

  public static getInstance(): CustomPromptsService {
    if (!CustomPromptsService.instance) {
      CustomPromptsService.instance = new CustomPromptsService()
    }
    return CustomPromptsService.instance
  }

  /**
   * 从本地存储加载配置
   */
  private loadConfig(): CustomPromptsConfig {
    try {
      const stored = localStorage.getItem('custom-prompts-config')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          projectPromptTemplate: parsed.projectPromptTemplate || DEFAULT_PROJECT_TEMPLATE,
          taskPromptButtons: parsed.taskPromptButtons || getDefaultTaskButtons()
        }
      }
    } catch (error) {
      console.error('Failed to load custom prompts config:', error)
    }

    return {
      projectPromptTemplate: DEFAULT_PROJECT_TEMPLATE,
      taskPromptButtons: [...getDefaultTaskButtons()]
    }
  }

  /**
   * 从后端加载配置
   */
  public async loadFromServer(): Promise<void> {
    try {
      const response = await customPromptsApi.getUserCustomPrompts()
      if (response.success && response.data) {
        this.config = response.data
        this.saveConfig() // 同步到本地存储
        this.isLoaded = true
      }
    } catch (error) {
      console.error('Failed to load config from server:', error)
      // 如果后端加载失败，使用本地存储的配置
    }
  }

  /**
   * 保存配置到本地存储
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('custom-prompts-config', JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save custom prompts config:', error)
    }
  }

  /**
   * 保存配置到后端
   */
  private async saveToServer(): Promise<void> {
    try {
      await customPromptsApi.saveUserCustomPrompts(this.config)
    } catch (error) {
      console.error('Failed to save config to server:', error)
      throw error
    }
  }

  /**
   * 获取项目提示词模板
   */
  public getProjectPromptTemplate(): string {
    return this.config.projectPromptTemplate
  }

  /**
   * 设置项目提示词模板
   */
  public async setProjectPromptTemplate(template: string): Promise<void> {
    this.config.projectPromptTemplate = template
    this.saveConfig()

    try {
      await customPromptsApi.saveProjectPromptTemplate(template)
    } catch (error) {
      console.error('Failed to save project template to server:', error)
      // 不抛出错误，允许本地保存成功
    }
  }

  /**
   * 获取任务提示词按钮配置
   */
  public getTaskPromptButtons(): TaskPromptButton[] {
    return [...this.config.taskPromptButtons].sort((a, b) => a.order - b.order)
  }

  /**
   * 设置任务提示词按钮配置
   */
  public async setTaskPromptButtons(buttons: TaskPromptButton[]): Promise<void> {
    this.config.taskPromptButtons = buttons
    this.saveConfig()

    try {
      await customPromptsApi.saveTaskPromptButtons(buttons)
    } catch (error) {
      console.error('Failed to save task buttons to server:', error)
      // 不抛出错误，允许本地保存成功
    }
  }

  /**
   * 渲染项目提示词
   */
  public renderProjectPrompt(context: RenderContext): string {
    return renderPromptTemplate(this.config.projectPromptTemplate, context)
  }

  /**
   * 渲染任务提示词
   */
  public renderTaskPrompt(buttonId: string, context: RenderContext): string {
    const button = this.config.taskPromptButtons.find(b => b.id === buttonId)
    if (!button) {
      throw new Error(`Task prompt button not found: ${buttonId}`)
    }
    return renderPromptTemplate(button.content, context)
  }

  /**
   * 重置为默认配置
   */
  public async resetToDefaults(): Promise<void> {
    this.config = {
      projectPromptTemplate: DEFAULT_PROJECT_TEMPLATE,
      taskPromptButtons: [...getDefaultTaskButtons()]
    }
    this.saveConfig()

    try {
      await customPromptsApi.resetCustomPromptsToDefault()
    } catch (error) {
      console.error('Failed to reset config on server:', error)
      // 不抛出错误，允许本地重置成功
    }
  }
}

export const customPromptsService = CustomPromptsService.getInstance()
export default customPromptsService
