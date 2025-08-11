/**
 * API配置工具
 * 根据当前域名动态构建API地址，支持开发和生产环境
 */

/**
 * 获取API基础URL
 * 优先使用环境变量，否则根据当前域名动态构建
 */
export function getApiBaseUrl(): string {
  // 检查是否在浏览器环境中
  if (typeof window === 'undefined') {
    console.warn('[API Config] Running in non-browser environment, using relative URL')
    return '/todo-for-ai/api/v1'
  }

  // 如果有环境变量配置，优先使用
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    console.log('[API Config] Using environment variable VITE_API_BASE_URL:', envUrl)
    return envUrl
  }

  // 根据当前域名动态构建API地址
  const currentHost = window.location.host
  const protocol = window.location.protocol

  console.log('[API Config] Detecting environment:', { currentHost, protocol })

  if (currentHost.includes('todo4ai.org')) {
    // 生产环境 - 通过nginx代理，不需要端口号
    const prodUrl = `${protocol}//todo4ai.org/todo-for-ai/api/v1`
    console.log('[API Config] Production environment detected, using:', prodUrl)
    return prodUrl
  } else {
    // 开发环境 - 使用Vite代理，避免跨域问题
    const devUrl = '/todo-for-ai/api/v1'
    console.log('[API Config] Development environment detected, using Vite proxy:', devUrl)
    return devUrl
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
    // 开发环境使用相对路径，避免写死localhost
    return ''
  }
}
