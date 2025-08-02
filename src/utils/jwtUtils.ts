/**
 * JWT工具函数
 * 用于解析、验证和检查JWT token
 */

export interface JWTPayload {
  sub: string | number  // subject (user id)
  exp: number          // expiration time (timestamp)
  iat: number          // issued at (timestamp)
  username?: string
  email?: string
  provider?: string
  [key: string]: any
}

/**
 * 解析JWT token获取payload
 * @param token JWT token字符串
 * @returns 解析后的payload或null
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null
    }

    // JWT格式：header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // 解码payload部分（base64url）
    const payload = parts[1]
    
    // 处理base64url编码（替换字符并添加padding）
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    
    // 解码并解析JSON
    const decoded = atob(padded)
    const parsed = JSON.parse(decoded)
    
    return parsed as JWTPayload
  } catch (error) {
    console.error('Failed to parse JWT token:', error)
    return null
  }
}

/**
 * 检查token是否过期
 * @param token JWT token字符串
 * @returns true表示已过期，false表示未过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  // exp是秒级时间戳，需要转换为毫秒
  const expirationTime = payload.exp * 1000
  const currentTime = Date.now()
  
  return currentTime >= expirationTime
}

/**
 * 获取token过期时间
 * @param token JWT token字符串
 * @returns 过期时间的Date对象或null
 */
export function getTokenExpirationTime(token: string): Date | null {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  return new Date(payload.exp * 1000)
}

/**
 * 获取token剩余有效时间（毫秒）
 * @param token JWT token字符串
 * @returns 剩余时间（毫秒），如果已过期返回0
 */
export function getTokenRemainingTime(token: string): number {
  const expirationTime = getTokenExpirationTime(token)
  if (!expirationTime) {
    return 0
  }

  const remainingTime = expirationTime.getTime() - Date.now()
  return Math.max(0, remainingTime)
}

/**
 * 检查是否需要刷新token
 * @param token JWT token字符串
 * @param refreshThresholdMinutes 刷新阈值（分钟），默认5分钟
 * @returns true表示需要刷新，false表示不需要
 */
export function shouldRefreshToken(token: string, refreshThresholdMinutes: number = 5): boolean {
  if (isTokenExpired(token)) {
    return false // 已过期，无法刷新
  }

  const remainingTime = getTokenRemainingTime(token)
  const thresholdTime = refreshThresholdMinutes * 60 * 1000 // 转换为毫秒

  return remainingTime <= thresholdTime
}

/**
 * 格式化剩余时间为可读字符串
 * @param token JWT token字符串
 * @returns 格式化的时间字符串
 */
export function formatTokenRemainingTime(token: string): string {
  const remainingTime = getTokenRemainingTime(token)
  
  if (remainingTime <= 0) {
    return '已过期'
  }

  const minutes = Math.floor(remainingTime / (60 * 1000))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天${hours % 24}小时`
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else {
    return `${minutes}分钟`
  }
}

/**
 * 验证token格式是否正确
 * @param token JWT token字符串
 * @returns true表示格式正确，false表示格式错误
 */
export function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

/**
 * 获取token的用户信息
 * @param token JWT token字符串
 * @returns 用户信息对象或null
 */
export function getTokenUserInfo(token: string): { id: string | number; username?: string; email?: string } | null {
  const payload = parseJWT(token)
  if (!payload) {
    return null
  }

  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email
  }
}

/**
 * 检查token是否即将在指定时间内过期
 * @param token JWT token字符串
 * @param minutes 检查的分钟数
 * @returns true表示即将过期，false表示不会过期
 */
export function willTokenExpireIn(token: string, minutes: number): boolean {
  const remainingTime = getTokenRemainingTime(token)
  const checkTime = minutes * 60 * 1000 // 转换为毫秒

  return remainingTime > 0 && remainingTime <= checkTime
}
