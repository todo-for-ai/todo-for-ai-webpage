import { KIND_COLORS } from './collaborationGraphShared'

/**
 * 图例区：kind 颜色 / 边色阶（消息量渐变 + 声誉差虚线）/ 节点尺寸梯度 / 声誉环。
 * 纯展示无 props，从 CollaborationGraphView 原样抽出。
 */
const GraphLegends = () => (
  <>
    {/* kind 颜色图例（填充+虚线边框表示分组） */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
      {Object.entries(KIND_COLORS).map(([kind, color]) => (
        <span key={kind} style={{ fontSize: 11, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, border: `2px dashed ${color}`, boxSizing: 'border-box' }} />
          {kind}
        </span>
      ))}
    </div>
    {/* 边色阶图例（按消息量连续渐变） */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: '#8c8c8c' }}>边色阶(消息量):</span>
      <span style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <span style={{ display: 'inline-block', width: 50, height: 6, borderRadius: 3, background: 'linear-gradient(to right, #bfbfbf, #1890ff, #722ed1)' }} />
        低 → 高
      </span>
      <span style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <span style={{ display: 'inline-block', width: 14, borderTop: '2px dashed #fa541c' }} />
        声誉差≥30
      </span>
    </div>
    {/* 节点尺寸图例（按消息量梯度） */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: '#8c8c8c' }}>节点尺寸(消息量, 中/高显示声誉值):</span>
      {[
        { r: 7, l: '低' },
        { r: 10, l: '中低' },
        { r: 14, l: '中' },
        { r: 18, l: '高' },
      ].map(({ r, l }) => (
        <span key={l} style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: r, height: r, borderRadius: '50%', background: '#bfbfbf' }} />
          {l}
        </span>
      ))}
    </div>
    {/* 声誉环图例（颜色+粗细） */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: '#8c8c8c' }}>声誉环:</span>
      {[
        { c: '#ff4d4f', w: 1.5, l: '低(<40)' },
        { c: '#faad14', w: 2.5, l: '中(≥50)' },
        { c: '#52c41a', w: 3.5, l: '高(≥80)' },
      ].map(({ c, w, l }) => (
        <span key={l} style={{ fontSize: 10, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 16, height: w, background: c, borderRadius: 2 }} />
          {l}
        </span>
      ))}
    </div>
  </>
)

export default GraphLegends
