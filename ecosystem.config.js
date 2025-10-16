module.exports = {
  apps: [
    {
      name: 'basecampgear',
      script: './server.js',
      
      // ==================== INSTANCE CONFIG ====================
      instances: 1, // Single instance (cukup untuk traffic kecil-menengah)
      exec_mode: 'fork', // Fork mode (bukan cluster)
      
      // ==================== WATCH & RELOAD ====================
      watch: false, // Jangan auto-reload di production
      ignore_watch: ['node_modules', 'logs', 'public/uploads'],
      
      // ==================== MEMORY & PERFORMANCE ====================
      max_memory_restart: '500M', // Auto restart jika memory > 500MB
      
      // ==================== ENVIRONMENT ====================
      env: {
        NODE_ENV: 'production', // Default production
        PORT: 4545
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4545
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4545
      },
      
      // ==================== LOGGING ====================
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true, // Add timestamp to logs
      merge_logs: true, // Merge logs from all instances
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // ==================== RESTART POLICY ====================
      autorestart: true, // Auto restart on crash
      max_restarts: 10, // Max restart attempts
      min_uptime: '10s', // Minimum uptime before considered stable
      restart_delay: 4000, // Wait 4s before restart
      
      // ==================== GRACEFUL SHUTDOWN ====================
      listen_timeout: 3000, // Wait for app to listen
      kill_timeout: 5000, // Time to wait for graceful shutdown
      
      // ==================== CRON RESTART ====================
      // cron_restart: '0 3 * * *', // Restart jam 3 pagi (DISABLED untuk stability)
      
      // ==================== ERROR HANDLING ====================
      exp_backoff_restart_delay: 100, // Exponential backoff untuk restart
      wait_ready: true, // Wait for ready signal
      
      // ==================== NODE ARGS ====================
      node_args: '--max-old-space-size=512', // Limit heap size
    }
  ],

  // ==================== DEPLOYMENT CONFIG ====================
  deploy: {
    production: {
      user: 'root',
      host: '47.237.23.149', // IP server Anda
      ref: 'origin/main',
      repo: '//github.com/IdeaQru/basecamgear.git',
      // Ganti dengan repo Anda
      path: '/root/basecamgear', // Path di server
      'pre-deploy-local': 'echo "🚀 Starting deployment..."',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production && pm2 save',
      'post-setup': 'ls -la',
      ssh_options: 'StrictHostKeyChecking=no'
    },
    
    // Staging environment (optional)
    staging: {
      user: 'root',
      host: '47.237.23.149',
      ref: 'origin/develop',
      repo: '//github.com/IdeaQru/basecamgear.git',
      path: '/root/basecamgear-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development'
    }
  }
};
