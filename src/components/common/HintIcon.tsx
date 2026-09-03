/**
 * HintIcon —— 全产品通用的"问号提示"图标。
 *
 * 放在卡片标题、表格列头、字段标签等概念性元素旁，悬停/点击给出
 * 一句话解释。文案要求：解释"这是什么、对你意味着什么"，而不是
 * 重复标签本身。
 */
import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

interface HintIconProps {
  title: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

export function HintIcon({ title, placement = 'top' }: HintIconProps) {
  return (
    <Tooltip title={title} placement={placement} overlayStyle={{ maxWidth: 360 }}>
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
