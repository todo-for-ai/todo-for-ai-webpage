import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './TaskIdBadge.module.css'

export interface TaskIdBadgeProps {
  /** 任务ID */
  taskId: number | string
  /** 徽标大小 */
  size?: 'small' | 'medium' | 'large'
  /** 自定义样式 */
  style?: React.CSSProperties
  /** 自定义类名 */
  className?: string
  /** 自定义点击事件（可选，默认跳转到任务详情页面） */
  onClick?: () => void
}

/**
 * 任务ID徽标组件
 * 统一的任务ID显示组件，用于在任务列表、任务详情等页面中显示任务ID
 * 默认点击跳转到任务详情页面，符合UI设计的四个基本原则：亲密性、对齐、重复和对比
 */
const TaskIdBadge: React.FC<TaskIdBadgeProps> = ({
  taskId,
  size = 'medium',
  style,
  className,
  onClick
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // 默认跳转到任务详情页面
      navigate(`/todo-for-ai/pages/tasks/${taskId}`)
    }
  }

  const badgeClasses = [
    styles.taskIdBadge,
    styles[`size-${size}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={badgeClasses}
      style={style}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={`查看任务 #${taskId} 详情`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      #{taskId}
    </div>
  )
}

export default TaskIdBadge
