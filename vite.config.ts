import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 获取git信息和构建时间
function getGitInfo() {
  try {
    // 动态导入 child_process
    const { execSync } = require('child_process')

    // 设置git命令的执行选项，确保从正确的仓库根目录获取信息
    const gitOptions = { encoding: 'utf8' as const, cwd: '..' }

    // 获取最新的git tag
    const gitTag = execSync('git tag --sort=-version:refname | head -1', gitOptions).trim() || 'v1.0'

    // 获取当前commit id (短版本)
    const commitId = execSync('git rev-parse --short HEAD', gitOptions).trim()

    // 获取构建时间
    const buildTime = new Date().toISOString()

    return {
      gitTag,
      commitId,
      buildTime
    }
  } catch (error) {
    // 如果获取git信息失败，返回默认值
    return {
      gitTag: 'v1.0',
      commitId: 'unknown',
      buildTime: new Date().toISOString()
    }
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  const gitInfo = getGitInfo()

  return {
    plugins: [react()],
    define: {
      __GIT_TAG__: JSON.stringify(gitInfo.gitTag),
      __COMMIT_ID__: JSON.stringify(gitInfo.commitId),
      __BUILD_TIME__: JSON.stringify(gitInfo.buildTime),
    },
    build: {
      // 设置chunk大小警告限制
      chunkSizeWarningLimit: 5000,
      // 启用压缩，使用esbuild（默认）
      minify: 'esbuild' as const,
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 启用源映射（生产环境可禁用以减小包体积）
      sourcemap: false,
      // 启用rollup打包优化
      rollupOptions: {
        output: {
          // 手动指定chunks，优化加载性能
          manualChunks: {
            // 将React相关库单独打包
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // 将Ant Design单独打包
            'antd-vendor': ['antd', '@ant-design/icons'],
            // 将Milkdown编辑器相关打包
            'milkdown-vendor': [
              '@milkdown/core',
              '@milkdown/preset-commonmark',
              '@milkdown/preset-gfm',
              '@milkdown/react',
              '@milkdown/theme-nord'
            ],
            // 将i18n相关打包
            'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
          }
        }
      }
    },
    server: {
      port: 50111,
      host: '0.0.0.0',
      proxy: {
        '/todo-for-ai/api': {
          target: 'http://localhost:50112',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    preview: {
      port: 50112,
      host: '0.0.0.0'
    }
  }
})
