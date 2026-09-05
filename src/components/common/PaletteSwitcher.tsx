/**
 * PaletteSwitcher —— 像素皮肤切换器（右下角悬浮）
 *
 * 色板定义见 src/theme/palettes.ts（单一事实源）。切换时三层生效：
 * 1. 即时应用 CSS 变量；2. localStorage（未登录/下次首屏快路径）；
 * 3. PUT /user-settings（到人级别持久化，登录后跨设备跟随；失败静默降级为仅本地）。
 * 挂载时拉取服务端皮肤：与本地不一致时以服务端为准（跨设备真值）。
 */
import { useEffect, useState } from 'react'
import { Tooltip } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { apiClient } from '../../api'
import {
  PALETTES,
  applyPalette,
  applySavedPalette,
  readSavedPaletteId,
  savePaletteId,
} from '../../theme/palettes'

// 兼容既有导入（Login 等公开页从这里取 applySavedPalette）
export { applySavedPalette }

export function PaletteSwitcher() {
  const [current, setCurrent] = useState<string>(() => readSavedPaletteId())

  // 首屏先应用本地选择（避免闪烁），随后以服务端持久化值校准（跨设备真值）
  useEffect(() => {
    applyPalette(current)
    let cancelled = false
    apiClient
      .get('/user-settings')
      .then((resp: any) => {
        // apiClient 已解包后端标准结构，data 本体或再包一层 data 都兼容
        const serverTheme = resp?.theme || resp?.data?.theme
        if (!cancelled && serverTheme && serverTheme !== readSavedPaletteId()) {
          applyPalette(serverTheme)
          savePaletteId(serverTheme)
          setCurrent(serverTheme)
        }
      })
      .catch(() => {
        // 未登录/接口失败：保持本地选择
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = (id: string) => {
    setCurrent(id)
    applyPalette(id)
    savePaletteId(id)
    // 到人级别持久化；未登录或失败时静默降级为仅本地
    apiClient.put('/user-settings', { theme: id }).catch(() => {})
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 14,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        background: '#1f1f1f',
        border: '2px solid #000',
        boxShadow: '2px 2px 0 #000',
      }}
      title="像素皮肤"
    >
      <BgColorsOutlined style={{ color: '#ffe28a', fontSize: 13 }} />
      {PALETTES.map((p) => (
        <Tooltip key={p.id} title={p.name}>
          <button
            aria-label={p.name}
            onClick={() => select(p.id)}
            style={{
              width: 18,
              height: 18,
              cursor: 'pointer',
              background: p.swatch,
              border: current === p.id ? '2px solid #ffe28a' : '2px solid #000',
              padding: 0,
            }}
          />
        </Tooltip>
      ))}
    </div>
  )
}

export default PaletteSwitcher
