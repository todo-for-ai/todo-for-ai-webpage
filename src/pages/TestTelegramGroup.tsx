import React from 'react'
import { Card, Typography, Space, Button } from 'antd'
import TelegramGroup from '../components/TelegramGroup/TelegramGroup'
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Paragraph } = Typography

const TestTelegramGroup: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (lang: 'zh-CN' | 'en') => {
    setLanguage(lang)
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Title level={2}>TelegramGroup 组件测试</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>当前语言设置</Title>
            <Paragraph>当前语言: {language}</Paragraph>
            <Space>
              <Button 
                type={language === 'zh-CN' ? 'primary' : 'default'}
                onClick={() => handleLanguageChange('zh-CN')}
              >
                中文
              </Button>
              <Button 
                type={language === 'en' ? 'primary' : 'default'}
                onClick={() => handleLanguageChange('en')}
              >
                English
              </Button>
            </Space>
          </div>

          <div>
            <Title level={4}>组件说明</Title>
            <Paragraph>
              TelegramGroup 组件应该：
            </Paragraph>
            <ul>
              <li>只在英文模式下显示在页面右下角</li>
              <li>显示为蓝色的悬浮按钮，文字为 "TG AIGC Group"</li>
              <li>鼠标悬停时显示弹窗，包含加入群组的信息</li>
              <li>点击按钮可以跳转到 Telegram 群链接</li>
            </ul>
          </div>

          <div>
            <Title level={4}>测试步骤</Title>
            <ol>
              <li>切换到英文模式，查看右下角是否出现 TelegramGroup 按钮</li>
              <li>切换到中文模式，确认 TelegramGroup 按钮消失</li>
              <li>在英文模式下，鼠标悬停在按钮上查看弹窗</li>
              <li>点击按钮测试是否能正确跳转到 Telegram 群</li>
            </ol>
          </div>
        </Space>
      </Card>

      {/* TelegramGroup 组件会自动根据语言显示/隐藏 */}
      <TelegramGroup />
    </div>
  )
}

export default TestTelegramGroup
