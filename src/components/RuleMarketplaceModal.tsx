// 占位文件 - RuleMarketplaceModal
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

interface RuleMarketplaceModalProps {
  visible: boolean
  rule: any
  onClose: () => void
  onInstall: (rule: any) => Promise<void>
}

export const RuleMarketplaceModal: React.FC<RuleMarketplaceModalProps> = () => {
  return null
}

export default RuleMarketplaceModal
