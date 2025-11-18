// ThemeManagerCore 占位实现
export class ThemeManagerCore {
  constructor(config?: any) {
    // 占位
  }
  
  getCurrentTheme() {
    return null
  }
  
  setTheme(themeId: string) {
    // 占位
  }
  
  loadTheme(id?: string, registry?: any): Promise<any> {
    return Promise.resolve(null)
  }
  
  applyTheme(theme: any, listeners?: any) {
    // 占位
  }
}

export default ThemeManagerCore
