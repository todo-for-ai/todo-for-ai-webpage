/**
 * 认证重定向工具
 * 处理登录跳转和登录后的重定向逻辑
 */

/**
 * 保存当前页面URL用于登录后跳转
 */
export function saveCurrentPageForRedirect(): void {
  const currentPath = window.location.pathname + window.location.search + window.location.hash
  
  // 排除不需要保存的页面
  const excludePaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const shouldExclude = excludePaths.some(path => currentPath.includes(path))
  
  if (!shouldExclude) {
    localStorage.setItem('redirect_after_login', currentPath)
    console.log('[AuthRedirect] 保存当前页面用于登录后跳转:', currentPath)
  }
}

/**
 * 获取登录后应该跳转的URL
 */
export function getRedirectUrlAfterLogin(): string {
  const savedUrl = localStorage.getItem('redirect_after_login')
  const defaultUrl = '/todo-for-ai/pages'
  
  if (savedUrl) {
    // 清除保存的URL
    localStorage.removeItem('redirect_after_login')
    console.log('[AuthRedirect] 使用保存的跳转URL:', savedUrl)
    return savedUrl
  }
  
  console.log('[AuthRedirect] 使用默认跳转URL:', defaultUrl)
  return defaultUrl
}

/**
 * 跳转到登录页面
 * @param reason 跳转原因，用于显示提示信息
 */
export function redirectToLogin(reason: 'expired' | 'unauthorized' | 'required' = 'required'): void {
  // 保存当前页面
  saveCurrentPageForRedirect()
  
  // 构建登录URL
  const loginUrl = '/todo-for-ai/pages/login'
  const urlParams = new URLSearchParams()
  
  // 添加跳转原因参数
  if (reason !== 'required') {
    urlParams.set('reason', reason)
  }
  
  const finalUrl = urlParams.toString() ? `${loginUrl}?${urlParams.toString()}` : loginUrl
  
  console.log('[AuthRedirect] 跳转到登录页面:', finalUrl, '原因:', reason)
  
  // 执行跳转
  if (window.location.pathname !== loginUrl) {
    window.location.href = finalUrl
  }
}

/**
 * 处理登录成功后的跳转
 */
export function handleLoginSuccess(): void {
  const redirectUrl = getRedirectUrlAfterLogin()
  
  console.log('[AuthRedirect] 登录成功，跳转到:', redirectUrl)
  
  // 使用replace避免在浏览器历史中留下登录页面
  window.location.replace(redirectUrl)
}

/**
 * 检查当前页面是否需要认证
 */
export function isAuthRequiredPage(): boolean {
  const currentPath = window.location.pathname
  
  // 需要认证的页面路径
  const authRequiredPaths = [
    '/todo-for-ai/pages',
    '/todo-for-ai/pages/projects',
    '/todo-for-ai/pages/tasks',
    '/todo-for-ai/pages/kanban',
    '/todo-for-ai/pages/context-rules',
    '/todo-for-ai/pages/profile',
    '/todo-for-ai/pages/settings'
  ]
  
  return authRequiredPaths.some(path => currentPath.startsWith(path))
}

/**
 * 检查当前页面是否是公开页面
 */
export function isPublicPage(): boolean {
  const currentPath = window.location.pathname
  
  // 公开页面路径
  const publicPaths = [
    '/todo-for-ai/pages/login',
    '/todo-for-ai/pages/register',
    '/todo-for-ai/pages/forgot-password',
    '/todo-for-ai/pages/reset-password',
    '/todo-for-ai/pages/mcp-installation',
    '/todo-for-ai/pages/api-documentation',
    '/todo-for-ai/pages/about',
    '/todo-for-ai/pages/help'
  ]
  
  return publicPaths.some(path => currentPath.startsWith(path))
}

/**
 * 获取登录页面显示的提示信息
 */
export function getLoginMessage(reason?: string): string {
  switch (reason) {
    case 'expired':
      return '您的登录已过期，请重新登录'
    case 'unauthorized':
      return '您没有访问权限，请登录'
    case 'required':
    default:
      return '请登录以继续使用'
  }
}

/**
 * 清除所有认证相关的存储数据
 */
export function clearAuthStorage(): void {
  const keysToRemove = [
    'auth_token',
    'auth-storage', // Zustand persist key
    'redirect_after_login'
  ]
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })
  
  console.log('[AuthRedirect] 清除认证存储数据')
}

/**
 * 检查是否应该自动跳转到登录页面
 */
export function shouldAutoRedirectToLogin(): boolean {
  // 如果已经在登录页面，不需要跳转
  if (window.location.pathname.includes('/login')) {
    return false
  }
  
  // 如果是公开页面，不需要跳转
  if (isPublicPage()) {
    return false
  }
  
  // 如果是需要认证的页面，需要跳转
  return isAuthRequiredPage()
}

/**
 * 处理token过期的完整流程
 */
export function handleTokenExpired(): void {
  console.log('[AuthRedirect] 处理token过期')
  
  // 清除认证存储
  clearAuthStorage()
  
  // 清除auth store状态
  import('../stores/useAuthStore').then(({ useAuthStore }) => {
    useAuthStore.getState().clearAuth()
  })
  
  // 如果需要，跳转到登录页面
  if (shouldAutoRedirectToLogin()) {
    redirectToLogin('expired')
  }
}

/**
 * 处理未授权访问的完整流程
 */
export function handleUnauthorized(): void {
  console.log('[AuthRedirect] 处理未授权访问')
  
  // 清除认证存储
  clearAuthStorage()
  
  // 清除auth store状态
  import('../stores/useAuthStore').then(({ useAuthStore }) => {
    useAuthStore.getState().clearAuth()
  })
  
  // 跳转到登录页面
  redirectToLogin('unauthorized')
}
