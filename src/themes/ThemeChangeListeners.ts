/* eslint-disable @typescript-eslint/no-explicit-any */
// ThemeChangeListeners 占位实现
export class ThemeChangeListeners {
  addListener(_callback: (...args: any[]) => any) {
    // 占位
  }
  
  removeListener(_callback: (...args: any[]) => any) {
    // 占位
  }
  
  subscribe(_callback: (...args: any[]) => any) {
    // 占位
    return () => {} // 返回取消订阅函数
  }
}

export default ThemeChangeListeners
