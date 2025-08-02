/**
 * API配置工具
 * 根据当前域名动态构建API地址，支持开发和生产环境
 */

/**
 * 获取API基础URL
 * 优先使用环境变量，否则根据当前域名动态构建
 */
export function getApiBaseUrl(): string {
  // 如果有环境变量配置，优先使用
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 根据当前域名动态构建API地址
  const currentHost = window.location.host
  const protocol = window.location.protocol
  
  if (currentHost.includes('todo4ai.org')) {
    // 生产环境 - 通过nginx代理，不需要端口号
    return `${protocol}//todo4ai.org/todo-for-ai/api/v1`
  } else {
    // 开发环境或其他环境
    return 'http://localhost:50110/todo-for-ai/api/v1'
  }
}

/**
 * 获取MCP服务器URL
 */
export function getMcpServerUrl(): string {
  if (import.meta.env.VITE_MCP_SERVER_URL) {
    return import.meta.env.VITE_MCP_SERVER_URL
  }
  
  const currentHost = window.location.host
  const protocol = window.location.protocol
  
  if (currentHost.includes('todo4ai.org')) {
    return `${protocol}//todo4ai.org`
  } else {
    return 'http://localhost:50110'
  }
}
