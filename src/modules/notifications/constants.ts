export const notificationLevelColorMap: Record<string, string> = {
  success: 'green',
  warning: 'orange',
  error: 'red',
  info: 'blue',
}

export const notificationChannelTypeOptions = [
  { label: 'Webhook', value: 'webhook' },
  { label: '飞书', value: 'feishu' },
  { label: '企业微信', value: 'wecom' },
  { label: '钉钉', value: 'dingtalk' },
]
