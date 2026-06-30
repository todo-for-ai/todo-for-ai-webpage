import React from 'react'
import { Tooltip } from 'antd'

interface Props {
  capabilities: string[]
  maxDisplay?: number
  size?: number
}

/**
 * Simple SVG radar chart for Agent capabilities.
 * Each capability gets a spoke; the filled area shows how many the agent has.
 */
const CapabilityRadar: React.FC<Props> = ({ capabilities, maxDisplay = 8, size = 120 }) => {
  const caps = capabilities.slice(0, maxDisplay)
  const n = caps.length
  if (n < 3) {
    // Not enough data for a radar, show simple tags
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {caps.map(c => (
          <span key={c} style={{ fontSize: 10, background: '#e6f7ff', padding: '1px 6px', borderRadius: 4, color: '#1890ff' }}>
            {c}
          </span>
        ))}
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 18
  const angleStep = (2 * Math.PI) / n

  // Points on the unit circle for each axis
  const points = caps.map((_, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  // All capabilities are present (filled), so the polygon uses r for each axis
  const filledPoints = points.map(p => p)

  // Grid rings (3 levels)
  const rings = [0.33, 0.66, 1.0]

  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {rings.map((scale, ri) => {
          const ringPoints = caps.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep
            return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`
          }).join(' ')
          return <polygon key={ri} points={ringPoints} fill="none" stroke="#e8e8e8" strokeWidth={0.5} />
        })}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e8e8e8" strokeWidth={0.5} />
        ))}

        {/* Filled polygon */}
        <polygon
          points={filledPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(24,144,255,0.15)"
          stroke="#1890ff"
          strokeWidth={1.5}
        />

        {/* Dots and labels */}
        {caps.map((cap, i) => {
          const angle = -Math.PI / 2 + i * angleStep
          const labelR = r + 12
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)
          return (
            <g key={i}>
              <circle cx={filledPoints[i].x} cy={filledPoints[i].y} r={2.5} fill="#1890ff" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fill="#666"
              >
                {cap.length > 8 ? cap.slice(0, 7) + '…' : cap}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default CapabilityRadar
