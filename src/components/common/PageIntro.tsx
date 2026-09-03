/**
 * PageIntro —— 全产品通用的"页面引导说明"条。
 *
 * 首次进入页面时展示一段"这个页面是干什么的、应该怎么用"的说明，
 * 用户关闭后按 storageKey 记住不再打扰（换说明文案后可通过版本后缀
 * 重新展示，例如 storageKey = 'page-intro:projectDetail:v2'）。
 */
import { useState } from 'react'
import { Alert } from 'antd'
import type { ReactNode } from 'react'

interface PageIntroProps {
  /** localStorage 键，建议带版本号便于日后更新文案后重新展示 */
  storageKey: string
  title: ReactNode
  description: ReactNode
}

export function PageIntro({ storageKey, title, description }: PageIntroProps) {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== '1'
    } catch {
      return true
    }
  })

  if (!visible) {
    return null
  }

  return (
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message={title}
      description={description}
      onClose={() => {
        try {
          localStorage.setItem(storageKey, '1')
        } catch {
          // localStorage 不可用时忽略，仅本次会话内隐藏
        }
        setVisible(false)
      }}
    />
  )
}
