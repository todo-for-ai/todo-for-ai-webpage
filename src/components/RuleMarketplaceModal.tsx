// 占位文件 - RuleMarketplaceModal
import React from 'react'

interface RuleMarketplaceModalProps {
  visible: boolean
  rule: any
  onClose: () => void
  onInstall: (rule: any) => Promise<void>
}

export const RuleMarketplaceModal: React.FC<RuleMarketplaceModalProps> = ({ visible, rule, onClose, onInstall }) => {
  return null
}

export default RuleMarketplaceModal
