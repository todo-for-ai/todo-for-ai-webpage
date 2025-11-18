import { useRef, useCallback } from 'react'

/**
 * 防抖Hook - 延迟执行函数
 * @param callback 要执行的回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  return debouncedCallback
}

/**
 * 立即执行防抖Hook - 立即执行第一次调用，后续调用等待延迟
 * @param callback 要执行的回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 立即执行防抖后的函数
 */
export function useImmediateDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCallRef = useRef<number>(0)

  const immediateDebouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 如果是第一次调用或距离上次调用超过延迟时间，立即执行
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        callback(...args)
      } else {
        // 否则延迟执行
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          callback(...args)
        }, delay - (now - lastCallRef.current))
      }
    },
    [callback, delay]
  ) as T

  return immediateDebouncedCallback
}
