import React, { useEffect, useState, useCallback } from 'react'
import { Spin, Result, Button } from 'antd'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useTranslation } from '../../i18n/hooks/useTranslation'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallback
}) => {
  const { tc } = useTranslation()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  // 使用useCallback来稳定checkAuth函数引用
  const stableCheckAuth = useCallback(async () => {
    return useAuthStore.getState().checkAuth()
  }, [])

  useEffect(() => {
    const verifyAuth = async () => {
      if (requireAuth) {
        await stableCheckAuth()
      }
      setIsChecking(false)
    }

    verifyAuth()
  }, [requireAuth, stableCheckAuth])

  // 显示加载状态
  if (isLoading || isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <Spin size="large" tip={tc('authGuard.verifying')} />
      </div>
    )
  }

  // 不需要认证的页面
  if (!requireAuth) {
    return <>{children}</>
  }

  // 需要认证但未登录
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    // 直接重定向到登录页面
    return <Navigate to="/todo-for-ai/pages/login" replace />
  }

  // 需要管理员权限但用户不是管理员
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <Result
        status="403"
        title={tc('authGuard.forbidden.title')}
        subTitle={tc('authGuard.forbidden.subtitle')}
        extra={
          <Button type="primary" href="/todo-for-ai/pages">
            {tc('authGuard.backHome')}
          </Button>
        }
      />
    )
  }

  // 用户账户被暂停
  if (user?.status === 'suspended') {
    return (
      <Result
        status="warning"
        title={tc('authGuard.suspended.title')}
        subTitle={tc('authGuard.suspended.subtitle')}
        extra={
          <Button type="primary" onClick={() => useAuthStore.getState().logout()}>
            {tc('authGuard.relogin')}
          </Button>
        }
      />
    )
  }

  // 用户账户未激活
  if (user?.status === 'inactive') {
    return (
      <Result
        status="warning"
        title={tc('authGuard.inactive.title')}
        subTitle={tc('authGuard.inactive.subtitle')}
        extra={
          <Button type="primary" onClick={() => useAuthStore.getState().logout()}>
            {tc('authGuard.relogin')}
          </Button>
        }
      />
    )
  }

  // 通过所有检查，渲染子组件
  return <>{children}</>
}

export default AuthGuard
