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
      // 启用代码分割，减小单个文件大小
      rollupOptions: {
        output: {
          manualChunks: {
            // 将大型依赖分离到单独的chunk
            'vendor-react': ['react', 'react-dom'],
            'vendor-antd': ['antd'],
            'vendor-utils': ['axios', 'dayjs', 'lodash-es'],
            'vendor-icons': ['@ant-design/icons'],
          }
        }
      },
      // 设置chunk大小警告限制
      chunkSizeWarningLimit: 1000,
      // 启用压缩，使用esbuild（默认）
      minify: 'esbuild'
    },
    server: {
      port: 50111,
      host: '0.0.0.0',
      proxy: {
        '/todo-for-ai/api': {
          target: 'http://localhost:50110',
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
