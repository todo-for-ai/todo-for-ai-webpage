module.exports = {
  apps: [
    {
      name: 'todo-for-ai-web-dev',
      cwd: __dirname,
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development'
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,
      time: true
    },
    {
      name: 'todo-for-ai-web-preview',
      cwd: __dirname,
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production'
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,
      time: true
    }
  ]
}
