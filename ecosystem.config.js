module.exports = {
  apps: [
    {
      name: 'products-csv-downloader',
      script: 'server/index.js',
      instances: 'max', // Auto-scales to all available CPU cores on production servers
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 4000
      }
    }
  ]
};
