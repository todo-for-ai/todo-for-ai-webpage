/* eslint-disable @typescript-eslint/no-explicit-any */
// 占位文件 - useActivityData hook
export const useActivityData = (_externalData?: any, _externalLoading?: any) => {
  return {
    data: [],
    loading: false,
    stats: { max: 0, total: 0, average: 0 },
    heatmapData: [],
    colorScale: [],
    getColorForValue: (_value: number) => '#eee'
  }
}
