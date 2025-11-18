export class CustomPromptsApi {
  async method1() {
    throw new Error('Not implemented')
  }

  async method2() {
    throw new Error('Not implemented')
  }

  async getUserCustomPrompts(): Promise<{ success: boolean; data?: any }> {
    return { success: false }
  }

  async saveUserCustomPrompts(config?: any): Promise<void> {
    throw new Error('Not implemented')
  }

  async saveProjectPromptTemplate(template?: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async saveTaskPromptButtons(buttons?: any): Promise<void> {
    throw new Error('Not implemented')
  }

  async resetCustomPromptsToDefault(): Promise<void> {
    throw new Error('Not implemented')
  }
}

// 导出单例实例
export const customPromptsApi = new CustomPromptsApi()
