// next.config.js
// const nextConfig = {



// };

// export default nextConfig;

const nextConfig = {
  reactStrictMode: true,

  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    // Enable server actions
    serverActions: {}
  },
  // List of packages that should be bundled for server components
  serverExternalPackages: ['@langchain/langgraph'],


  // Configure webpack to handle Node.js built-in modules
  webpack: (config, { isServer }) => {
    // Configure path aliases


    // Client-side only configurations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js built-ins that might be used by dependencies
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        module: false,
        'stream/web': false,
        // Add other Node.js built-ins as needed
      };

      // Ensure 'node:async_hooks' is aliased to false for client-side builds
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:async_hooks': false,
        'async_hooks': false, // Also alias without 'node:' prefix just in case
      };
    }
    return config;
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },

  // Output configuration
  output: 'standalone',

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

}

module.exports = nextConfig
