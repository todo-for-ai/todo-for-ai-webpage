/**
 * Google Analytics 4 (GA4) 集成工具
 * 提供页面浏览、事件追踪等功能
 */

// GA4 配置
export const GA_CONFIG = {
  // 测量ID - 实际使用时需要替换为真实的GA4测量ID
  MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  // 是否启用调试模式
  DEBUG_MODE: import.meta.env.DEV,
  // 是否启用GA（生产环境默认启用）
  ENABLED: import.meta.env.VITE_GA_ENABLED !== 'false',
}

// 声明全局gtag函数
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

/**
 * 初始化Google Analytics
 */
export const initializeGA = (): void => {
  if (!GA_CONFIG.ENABLED || !GA_CONFIG.MEASUREMENT_ID || GA_CONFIG.MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('[GA] Google Analytics disabled or not configured')
    return
  }

  try {
    // 创建dataLayer
    window.dataLayer = window.dataLayer || []
    
    // 定义gtag函数
    window.gtag = function() {
      window.dataLayer.push(arguments)
    }
    
    // 初始化GA
    window.gtag('js', new Date())
    window.gtag('config', GA_CONFIG.MEASUREMENT_ID, {
      debug_mode: GA_CONFIG.DEBUG_MODE,
      send_page_view: false, // 我们手动发送页面浏览事件
    })

    console.log('[GA] Google Analytics initialized with ID:', GA_CONFIG.MEASUREMENT_ID)
  } catch (error) {
    console.error('[GA] Failed to initialize Google Analytics:', error)
  }
}

/**
 * 加载GA脚本
 */
export const loadGAScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!GA_CONFIG.ENABLED || !GA_CONFIG.MEASUREMENT_ID || GA_CONFIG.MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      resolve()
      return
    }

    try {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_CONFIG.MEASUREMENT_ID}`
      script.onload = () => {
        initializeGA()
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 发送页面浏览事件
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!GA_CONFIG.ENABLED || typeof window.gtag !== 'function') {
    return
  }

  try {
    // 发送页面浏览事件
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
      debug_mode: GA_CONFIG.DEBUG_MODE
    })

    if (GA_CONFIG.DEBUG_MODE) {
      console.log('[GA] Page view tracked:', { path, title, location: window.location.href })
    }
  } catch (error) {
    console.error('[GA] Failed to track page view:', error)
  }
}

/**
 * 发送自定义事件
 */
export const trackEvent = (
  eventName: string,
  parameters?: {
    event_category?: string
    event_label?: string
    value?: number
    [key: string]: any
  }
): void => {
  if (!GA_CONFIG.ENABLED || typeof window.gtag !== 'function') {
    return
  }

  try {
    window.gtag('event', eventName, parameters)

    if (GA_CONFIG.DEBUG_MODE) {
      console.log('[GA] Event tracked:', { eventName, parameters })
    }
  } catch (error) {
    console.error('[GA] Failed to track event:', error)
  }
}

/**
 * 业务相关的事件追踪函数
 */
export const analytics = {
  // 用户认证相关
  auth: {
    login: (method: string = 'email') => {
      trackEvent('login', {
        event_category: 'authentication',
        method,
      })
    },
    logout: () => {
      trackEvent('logout', {
        event_category: 'authentication',
      })
    },
    register: (method: string = 'email') => {
      trackEvent('sign_up', {
        event_category: 'authentication',
        method,
      })
    },
  },

  // 项目相关
  project: {
    create: (projectId?: string) => {
      trackEvent('create_project', {
        event_category: 'project',
        project_id: projectId,
      })
    },
    view: (projectId: string) => {
      trackEvent('view_project', {
        event_category: 'project',
        project_id: projectId,
      })
    },
    edit: (projectId: string) => {
      trackEvent('edit_project', {
        event_category: 'project',
        project_id: projectId,
      })
    },
    delete: (projectId: string) => {
      trackEvent('delete_project', {
        event_category: 'project',
        project_id: projectId,
      })
    },
  },

  // 任务相关
  task: {
    create: (taskId?: string, projectId?: string) => {
      trackEvent('create_task', {
        event_category: 'task',
        task_id: taskId,
        project_id: projectId,
      })
    },
    view: (taskId: string, projectId?: string) => {
      trackEvent('view_task', {
        event_category: 'task',
        task_id: taskId,
        project_id: projectId,
      })
    },
    edit: (taskId: string, projectId?: string) => {
      trackEvent('edit_task', {
        event_category: 'task',
        task_id: taskId,
        project_id: projectId,
      })
    },
    statusChange: (taskId: string, fromStatus: string, toStatus: string) => {
      trackEvent('task_status_change', {
        event_category: 'task',
        task_id: taskId,
        from_status: fromStatus,
        to_status: toStatus,
      })
    },
    complete: (taskId: string, projectId?: string) => {
      trackEvent('complete_task', {
        event_category: 'task',
        task_id: taskId,
        project_id: projectId,
      })
    },
  },

  // 功能使用相关
  feature: {
    useKanban: () => {
      trackEvent('use_kanban', {
        event_category: 'feature',
      })
    },
    useMCP: () => {
      trackEvent('use_mcp', {
        event_category: 'feature',
      })
    },
    useContextRules: () => {
      trackEvent('use_context_rules', {
        event_category: 'feature',
      })
    },
    useCustomPrompts: () => {
      trackEvent('use_custom_prompts', {
        event_category: 'feature',
      })
    },
    downloadMCP: () => {
      trackEvent('download_mcp', {
        event_category: 'feature',
      })
    },
  },

  // 社交互动
  social: {
    joinWeChatGroup: () => {
      trackEvent('join_wechat_group', {
        event_category: 'social',
      })
    },
    joinTelegramGroup: () => {
      trackEvent('join_telegram_group', {
        event_category: 'social',
      })
    },
  },

  // 设置相关
  settings: {
    changeLanguage: (language: string) => {
      trackEvent('change_language', {
        event_category: 'settings',
        language,
      })
    },
    changeTheme: (theme: string) => {
      trackEvent('change_theme', {
        event_category: 'settings',
        theme,
      })
    },
  },

  // 错误追踪
  error: {
    apiError: (endpoint: string, statusCode: number) => {
      trackEvent('api_error', {
        event_category: 'error',
        endpoint,
        status_code: statusCode,
      })
    },
    jsError: (error: string, source?: string) => {
      trackEvent('javascript_error', {
        event_category: 'error',
        error_message: error,
        source,
      })
    },
  },
}

/**
 * React Hook for tracking page views
 */
export const usePageTracking = () => {
  const trackPage = (path: string, title?: string) => {
    trackPageView(path, title)
  }

  return { trackPage }
}
