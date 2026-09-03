/**
 * HintIcon —— 全产品通用的"问号提示"图标。
 *
 * 两种用法：
 *   <HintIcon title="自定义解释" />           直接给解释文本
 *   <HintIcon term="lease" />                 按全站术语表解释（common.json 的 glossary 段，
 *                                             同一术语在任何页面解释保持一致）
 *
 * 文案要求：解释"这是什么、对你意味着什么"，而不是重复标签本身。
 */
import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface HintIconProps {
  /** 直接指定解释内容（优先于 term） */
  title?: ReactNode
  /** 全站术语表键名（common.json → glossary.<term>） */
  term?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

export function HintIcon({ title, term, placement = 'top' }: HintIconProps) {
  const { tc } = usePageTranslation('common')
  let content = title
  if (!content && term) {
    const key = `glossary.${term}`
    const lookup = tc(key)
    content = lookup === key ? `（glossary.${term} 待补充）` : lookup
  }
  if (!content) {
    return null
  }
  return (
    <Tooltip title={content} placement={placement} overlayStyle={{ maxWidth: 380 }}>
      <QuestionCircleOutlined
        style={{ color: '#999', marginLeft: 4, cursor: 'help' }}
        aria-label="说明"
      />
    </Tooltip>
  )
}

/**
 * 在卡片标题等行内元素后附加 HintIcon 的便捷写法：
 *   title={withHint('代码仓库绑定', '仓库绑定让…')}
 */
export function withHint(label: ReactNode, hint: ReactNode): ReactNode {
  return (
    <span>
      {label}
      <HintIcon title={hint} />
    </span>
  )
}

/**
 * 术语提示：渲染术语标签本体 + 问号，用于行内正文中的名词。
 *   <TermHint label="任务租约" term="lease" />
 */
export function TermHint({ label, term }: { label: ReactNode; term: string }) {
  return (
    <span>
      {label}
      <HintIcon term={term} />
    </span>
  )
}
