/* eslint-disable @typescript-eslint/no-explicit-any */
// ThemeManagerCore 占位实现
export class ThemeManagerCore {
  constructor(_config?: any) {
    // 占位
  }
  
  getCurrentTheme() {
    return null
  }
  
  setTheme(_themeId: string) {
    // 占位
  }
  
  loadTheme(_id?: string, _registry?: any): Promise<any> {
    return Promise.resolve(null)
  }
  
  applyTheme(_theme: any, _listeners?: any) {
    // 占位
  }
}

export default ThemeManagerCore
