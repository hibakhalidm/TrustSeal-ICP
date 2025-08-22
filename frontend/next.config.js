/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
    WORKER_SERVICE_URL: process.env.WORKER_SERVICE_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
