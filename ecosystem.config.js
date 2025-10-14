module.exports = {
  apps: [
    {
      name: 'basecampgear',
      script: './server.js',
      instances: 2, // Gunakan 2 instance untuk load balancing
      exec_mode: 'cluster',
      watch: false, // Set true jika ingin auto-reload saat file berubah
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 4545
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4545
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      restart_delay: 4000,
      cron_restart: '0 3 * * *', // Restart setiap jam 3 pagi
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:username/basecampgear.git',
      path: '/var/www/basecampgear',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
