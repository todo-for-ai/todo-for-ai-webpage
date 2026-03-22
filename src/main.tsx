import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import './styles/flat-design.css' // 全局扁平化样式
import './i18n' // 初始化i18n
import App from './App.tsx'
import { LanguageProvider } from './contexts/LanguageContext'
import { loadGAScript } from './utils/analytics'

// 初始化Google Analytics
loadGAScript().catch(error => {
  console.warn('[GA] Failed to load Google Analytics:', error)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 4,
            fontSize: 14,
            boxShadow: 'none',
            boxShadowSecondary: 'none',
          },
          components: {
            Layout: {
              headerBg: '#fff',
              siderBg: '#fff',
            },
            Button: {
              borderRadius: 4,
              boxShadow: 'none',
              primaryShadow: 'none',
            },
            Card: {
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            },
            Table: {
              borderRadius: 8,
            },
            Input: {
              borderRadius: 4,
            },
            Select: {
              borderRadius: 4,
            },
            Tag: {
              borderRadius: 4,
            },
            Pagination: {
              borderRadius: 4,
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </LanguageProvider>
  </StrictMode>,
)
