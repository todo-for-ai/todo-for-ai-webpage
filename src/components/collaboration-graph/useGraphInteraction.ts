import { useState, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, RefObject, WheelEvent as ReactWheelEvent } from 'react'

/** 单个节点的拖拽位置覆盖（节点 id → svg 坐标） */
export type DragOverride = Record<number, { x: number; y: number }>

interface GraphInteractionOptions {
  /** 包裹 svg 的容器 ref：指针坐标换算时用它定位真实 <svg> */
  svgWrapRef: RefObject<HTMLDivElement | null>
  /** localStorage 持久化键：传入则节点拖拽位置按此键记忆，跨会话恢复 */
  storageKey?: string
}

/**
 * 协作图指针交互：节点拖拽位置覆盖（可选 localStorage 持久化）、背景拖拽平移、滚轮缩放。
 * 从 CollaborationGraphView 原样抽出；行为约定见 collaborationGraphViewInteraction.test.tsx
 * 与 useGraphInteraction 单测。
 */
export function useGraphInteraction({ svgWrapRef, storageKey }: GraphInteractionOptions) {
  // 拖拽：节点位置覆盖（用户手动调整），可选从 localStorage 恢复
  const loadPersisted = (): DragOverride => {
    if (!storageKey) return {}
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const out: DragOverride = {}
        for (const k of Object.keys(parsed)) {
          const v = parsed[k]
          if (v && typeof v.x === 'number' && typeof v.y === 'number') {
            out[Number(k)] = { x: v.x, y: v.y }
          }
        }
        return out
      }
    } catch {
      // ignore malformed storage
    }
    return {}
  }
  const [dragOverride, setDragOverride] = useState<DragOverride>(loadPersisted)
  const storageKeyRef = useRef(storageKey)
  storageKeyRef.current = storageKey
  const draggingRef = useRef<number | null>(null)
  const dragMovedRef = useRef(false)

  // 缩放与平移
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const panningRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  // 拖拽：将鼠标客户端坐标转为 svg 内坐标
  const svgPoint = (clientX: number, clientY: number) => {
    const svg = svgWrapRef.current?.querySelector('svg')
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }
  const onNodeDragStart = (id: number) => {
    draggingRef.current = id
    dragMovedRef.current = false
    setIsDragging(true)
  }
  const onSvgMouseMove = (e: ReactMouseEvent) => {
    if (draggingRef.current !== null) {
      dragMovedRef.current = true
      const p = svgPoint(e.clientX, e.clientY)
      setDragOverride((prev) => ({ ...prev, [draggingRef.current as number]: { x: p.x, y: p.y } }))
      return
    }
    if (panningRef.current) {
      setPan({
        x: panningRef.current.panX + (e.clientX - panningRef.current.startX),
        y: panningRef.current.panY + (e.clientY - panningRef.current.startY),
      })
    }
  }
  const onSvgMouseUp = () => {
    const wasNodeDrag = dragMovedRef.current && draggingRef.current !== null
    draggingRef.current = null
    panningRef.current = null
    setIsDragging(false)
    if (wasNodeDrag && storageKeyRef.current) {
      try {
        localStorage.setItem(storageKeyRef.current, JSON.stringify(dragOverride))
      } catch {
        // storage may be unavailable (private mode / quota)：仅保留内存内覆盖
        return
      }
    }
  }
  // 滚轮缩放
  const onSvgWheel = (e: ReactWheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom((z) => Math.max(0.3, Math.min(3, z * factor)))
  }
  // 背景拖拽平移（非节点时）
  const onBgMouseDown = (e: ReactMouseEvent) => {
    panningRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }
  // 节点 click 在拖拽释放后仍会触发：刚发生过拖拽则吞掉本次点击（返回 true 表示已消费）
  const consumeDragMoved = () => {
    const moved = dragMovedRef.current
    dragMovedRef.current = false
    return moved
  }
  // 缩放百分比徽标旁的「重置视图」
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return {
    zoom,
    pan,
    isDragging,
    dragOverride,
    onNodeDragStart,
    onSvgMouseMove,
    onSvgMouseUp,
    onSvgWheel,
    onBgMouseDown,
    consumeDragMoved,
    resetView,
  }
}
