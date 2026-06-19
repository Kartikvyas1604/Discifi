export const discifiConfig = {
  appName: 'DisciFi Sentinel',
  version: '0.1.0',
  description: 'Privacy-first, drain-proof hardware wallet system on Solana',
  supportEmail: 'support@discifi.io',
  docsUrl: 'https://docs.discifi.io',
  social: {
    twitter: '@discifi',
    github: 'discifi-protocol',
    discord: 'https://discord.gg/discifi',
  },
  networks: {
    solana: {
      mainnet: 'https://api.mainnet-beta.solana.com',
      devnet: 'https://api.devnet.solana.com',
      localnet: 'http://127.0.0.1:8899',
    },
  },
  defaultRateLimit: 100,
  rateLimitWindowMs: 60000,
} as const;
