/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['editvireo.com'],
    },
    // Enable standalone output for Amplify
    output: 'standalone',
    // Disable static optimization for SSR
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
}

module.exports = nextConfig
