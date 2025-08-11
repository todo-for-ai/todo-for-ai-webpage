import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
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
            colorPrimary: '#1890ff',
            borderRadius: 6,
            fontSize: 14,
          },
          components: {
            Layout: {
              headerBg: '#fff',
              siderBg: '#fff',
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </LanguageProvider>
  </StrictMode>,
)
