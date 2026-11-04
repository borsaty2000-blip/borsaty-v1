export const ROUTES = {
  home: '/',
  about: '/about',
  alerts: '/alerts',
  calendar: '/calendar',
  changelog: '/changelog',
  compare: '/compare',
  docs: '/docs',
  news: '/news',
  portfolio: '/portfolio',
  privacy: '/privacy',
  screener: '/screener',
  signIn: '/sign-in',
  signUp: '/sign-up',
  signals: '/signals',
  status: '/status',
  strategies: '/strategies',
  terms: '/terms',
  watchlist: '/watchlist',
} as const;

export type StaticRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const routes = {
  stock: (symbol: string) => `/stock/${encodeURIComponent(symbol)}`,
  strategy: (name: string) => `/strategies/${encodeURIComponent(name)}`,
} as const;
