/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore node modules that shouldn't be bundled
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Handle Privy's dynamic requires
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@privy-io/server-auth': '@privy-io/server-auth',
        '@hpke/core': '@hpke/core',
        '@hpke/chacha20poly1305': '@hpke/chacha20poly1305',
      });
    }

    return config;
  },
  // Transpile workspace packages
  transpilePackages: [
    '@openlibx402/privy',
    '@openlibx402/core',
    '@openlibx402/nextjs',
  ],
  experimental: {
    serverComponentsExternalPackages: [
      '@privy-io/server-auth',
      '@hpke/core',
      '@hpke/chacha20poly1305',
    ],
  },
};

module.exports = nextConfig;
