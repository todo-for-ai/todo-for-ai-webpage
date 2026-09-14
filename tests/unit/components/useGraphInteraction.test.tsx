import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import type { MouseEvent as ReactMouseEvent, RefObject, WheelEvent as ReactWheelEvent } from 'react'
import { useGraphInteraction } from '../../../src/components/collaboration-graph/useGraphInteraction'

const mouseAt = (clientX: number, clientY: number) => ({ clientX, clientY }) as unknown as ReactMouseEvent
const wheelAt = (deltaY: number) => ({ deltaY, preventDefault: () => {} }) as unknown as ReactWheelEvent

/** 构造带假 <svg> 的容器 ref：querySelector('svg') 返回可换算坐标的桩 */
const wrapRefWithSvg = (
  getScreenCTM: (() => unknown) | null,
  transformed = { x: 11, y: 22 },
): RefObject<HTMLDivElement | null> => {
  const fakeSvg = {
    createSVGPoint: () => ({ x: 0, y: 0, matrixTransform: () => transformed }),
    getScreenCTM,
  }
  return { current: { querySelector: () => fakeSvg } as unknown as HTMLDivElement }
}

describe('useGraphInteraction', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    cleanup()
  })

  it('初始状态：无 storageKey 时覆盖为空、zoom/pan 复位', () => {
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null } }))
    expect(result.current.zoom).toBe(1)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
    expect(result.current.isDragging).toBe(false)
    expect(result.current.dragOverride).toEqual({})
  })

  it('loadPersisted：恢复合法条目并过滤非法条目', () => {
    localStorage.setItem('cg-key', JSON.stringify({ '5': { x: 1, y: 2 }, bad: 'x', n: { x: 'a', y: 2 } }))
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null }, storageKey: 'cg-key' }))
    expect(result.current.dragOverride).toEqual({ 5: { x: 1, y: 2 } })
  })

  it('loadPersisted：损坏 JSON 走 catch 兜底为空', () => {
    localStorage.setItem('cg-bad', '{oops')
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null }, storageKey: 'cg-bad' }))
    expect(result.current.dragOverride).toEqual({})
  })

  it('loadPersisted：非对象 JSON（null）兜底为空', () => {
    localStorage.setItem('cg-null', 'null')
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null }, storageKey: 'cg-null' }))
    expect(result.current.dragOverride).toEqual({})
  })

  it('loadPersisted：storageKey 有但无存储条目时为空', () => {
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null }, storageKey: 'cg-missing' }))
    expect(result.current.dragOverride).toEqual({})
  })

  it('svgPoint：容器 ref 为空时拖拽落零点', () => {
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null } }))
    act(() => result.current.onNodeDragStart(3))
    act(() => result.current.onSvgMouseMove(mouseAt(50, 60)))
    expect(result.current.dragOverride[3]).toEqual({ x: 0, y: 0 })
    act(() => result.current.onSvgMouseUp())
    expect(result.current.isDragging).toBe(false)
  })

  it('svgPoint：getScreenCTM 缺失时返回零点', () => {
    const ref = wrapRefWithSvg(() => null)
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: ref }))
    act(() => result.current.onNodeDragStart(4))
    act(() => result.current.onSvgMouseMove(mouseAt(50, 60)))
    expect(result.current.dragOverride[4]).toEqual({ x: 0, y: 0 })
  })

  it('节点拖拽全流程：坐标换算、松开持久化、consumeDragMoved 吞一次点击', () => {
    const ref = wrapRefWithSvg(() => ({ inverse: () => ({}) }))
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: ref, storageKey: 'cg-drag' }))
    act(() => result.current.onNodeDragStart(7))
    expect(result.current.isDragging).toBe(true)
    act(() => result.current.onSvgMouseMove(mouseAt(100, 100)))
    expect(result.current.dragOverride[7]).toEqual({ x: 11, y: 22 })
    act(() => result.current.onSvgMouseUp())
    expect(result.current.isDragging).toBe(false)
    expect(localStorage.getItem('cg-drag')).toBe(JSON.stringify({ 7: { x: 11, y: 22 } }))
    // 刚拖拽过：第一次 click 被吞，第二次放行
    expect(result.current.consumeDragMoved()).toBe(true)
    expect(result.current.consumeDragMoved()).toBe(false)
  })

  it('storage 写入失败（隐私模式/配额）不抛错', () => {
    const ref = wrapRefWithSvg(() => ({ inverse: () => ({}) }))
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: ref, storageKey: 'cg-quota' }))
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded')
      })
    try {
      act(() => result.current.onNodeDragStart(9))
      act(() => result.current.onSvgMouseMove(mouseAt(1, 2)))
      act(() => {
        expect(() => result.current.onSvgMouseUp()).not.toThrow()
      })
    } finally {
      setItemSpy.mockRestore()
    }
    expect(result.current.isDragging).toBe(false)
  })

  it('滚轮缩放有上下限，重置视图恢复 zoom/pan', () => {
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null } }))
    for (let i = 0; i < 30; i++) {
      act(() => result.current.onSvgWheel(wheelAt(-100)))
    }
    expect(result.current.zoom).toBe(3)
    for (let i = 0; i < 60; i++) {
      act(() => result.current.onSvgWheel(wheelAt(100)))
    }
    expect(result.current.zoom).toBe(0.3)
    act(() => result.current.onBgMouseDown(mouseAt(100, 100)))
    act(() => result.current.onSvgMouseMove(mouseAt(130, 120)))
    expect(result.current.pan).toEqual({ x: 30, y: 20 })
    act(() => result.current.resetView())
    expect(result.current.zoom).toBe(1)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })

  it('背景平移：按下拖动更新 pan，松开后移动不再生效', () => {
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: { current: null } }))
    act(() => result.current.onBgMouseDown(mouseAt(10, 10)))
    act(() => result.current.onSvgMouseMove(mouseAt(40, 25)))
    expect(result.current.pan).toEqual({ x: 30, y: 15 })
    act(() => result.current.onSvgMouseUp())
    act(() => result.current.onSvgMouseMove(mouseAt(100, 100)))
    expect(result.current.pan).toEqual({ x: 30, y: 15 })
  })

  it('非拖拽松开不触发持久化', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const ref = wrapRefWithSvg(() => ({ inverse: () => ({}) }))
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: ref, storageKey: 'cg-nodrag' }))
    act(() => result.current.onSvgMouseUp())
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('storageKey 为空时拖拽不写存储但吞点击逻辑一致', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const ref = wrapRefWithSvg(() => ({ inverse: () => ({}) }))
    const { result } = renderHook(() => useGraphInteraction({ svgWrapRef: ref }))
    act(() => result.current.onNodeDragStart(2))
    act(() => result.current.onSvgMouseMove(mouseAt(5, 5)))
    act(() => result.current.onSvgMouseUp())
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(result.current.consumeDragMoved()).toBe(true)
    setItemSpy.mockRestore()
  })
})
