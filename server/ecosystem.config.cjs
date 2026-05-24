module.exports = {
  apps: [
    {
      name: 'ai-interview-server',
      script: 'src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};