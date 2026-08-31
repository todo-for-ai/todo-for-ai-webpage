import { useState, useCallback } from 'react'

export const useTaskSelection = () => {
  const [selectedRowKeys] = useState<React.Key[]>([])

  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([])

  const handleTaskSelection = useCallback(() => ({

    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedTaskIds(selectedRowKeys as number[])
    },
    selectedRowKeys
  }), [selectedRowKeys])

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds([])
  }, [])

  return {
    selectedTaskIds,
    handleTaskSelection,
    handleClearSelection
  }
}
