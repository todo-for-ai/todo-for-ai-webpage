import { useEffect, useRef } from 'react'

/**
 * 性能监控Hook
 * 用于追踪组件渲染性能和次数
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef<number | null>(null)
  const mountedTime = useRef<number>(Date.now())

  useEffect(() => {
    renderCount.current += 1
    const now = Date.now()
    const timeSinceMount = now - mountedTime.current
    const timeSinceLastRender = lastRenderTime
      ? now - lastRenderTime.current
      : 0

    // 在开发环境中记录性能信息
    if (import.meta.env.DEV) {
      console.log(
        `[Performance] ${componentName} - Render #${renderCount.current} - ` +
        `Time since mount: ${timeSinceMount}ms - ` +
        `Time since last render: ${timeSinceLastRender}ms`
      )
    }

    lastRenderTime.current = now

    // 组件卸载时输出统计信息
    return () => {
      if (import.meta.env.DEV) {
        const totalTime = Date.now() - mountedTime.current
        console.log(
          `[Performance] ${componentName} unmounted after ` +
          `${renderCount.current} renders over ${totalTime}ms`
        )
      }
    }
  })

  return {
    renderCount: renderCount.current,
    getRenderCount: () => renderCount.current
  }
}

/**
 * 批量性能监控Hook
 * 用于监控多个组件的性能
 */
export function useBatchPerformanceMonitor(components: string[]) {
  const startTime = useRef<number>(Date.now())
  const results = useRef<Record<string, { count: number; lastRender: number }>>({})

  useEffect(() => {
    const now = Date.now()
    components.forEach(component => {
      if (!results.current[component]) {
        results.current[component] = { count: 0, lastRender: now }
      }
      results.current[component].count++
      results.current[component].lastRender = now
    })

    if (import.meta.env.DEV && components.length > 0) {
      console.log('[BatchPerformance] Render summary:', results.current)
    }
  })

  const getResults = () => results.current
  const getHeavyRenderers = (threshold: number = 5) => {
    return Object.entries(results.current)
      .filter(([, data]) => data.count > threshold)
      .sort((a, b) => b[1].count - a[1].count)
  }

  return {
    getResults,
    getHeavyRenderers
  }
}

/**
 * Memory usage monitor (for debugging)
 */
export function useMemoryMonitor(label: string) {
  const startTime = useRef<number>(Date.now())

  useEffect(() => {
    if (import.meta.env.DEV) {
      const memoryInfo = (performance as any).memory
      if (memoryInfo) {
        console.log(
          `[Memory] ${label} - ` +
          `Used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB - ` +
          `Total: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
        )
      }
    }

    return () => {
      if (import.meta.env.DEV) {
        const duration = Date.now() - startTime.current
        console.log(`[Memory] ${label} mounted for ${duration}ms`)
      }
    }
  })
}
