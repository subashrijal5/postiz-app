module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: '/app/apps/frontend/.next/standalone/apps/frontend',
      script: 'server.js',
      env: {
        PORT: '4200',
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production',
      },
    },
    {
      name: 'backend',
      cwd: '/app/apps/backend',
      interpreter: 'node',
      node_args: ['--experimental-require-module'],
      script: 'dist/apps/backend/src/main.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'orchestrator',
      cwd: '/app/apps/orchestrator',
      interpreter: 'node',
      node_args: ['--experimental-require-module'],
      script: 'dist/apps/orchestrator/src/main.js',
      env: { NODE_ENV: 'production' },
    },
  ],
};
