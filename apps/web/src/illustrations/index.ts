export const ILLUSTRATIONS = {
  hero: '/illustrations/hero.svg',
  dashboard: '/illustrations/dashboard.svg',
  invoices: '/illustrations/invoices.svg',
  compliance: '/illustrations/compliance.svg',
  security: '/illustrations/security.svg',
  currency: '/illustrations/currency.svg',
  empty: '/illustrations/empty.svg',
  error: '/illustrations/error.svg',
  success: '/illustrations/success.svg',
  team: '/illustrations/team.svg',
  growth: '/illustrations/growth.svg',
  shield: '/illustrations/shield.svg',
  globe: '/illustrations/globe.svg',
  chart: '/illustrations/chart.svg',
  onboarding: '/illustrations/onboarding.svg',
  notification: '/illustrations/notification.svg',
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;