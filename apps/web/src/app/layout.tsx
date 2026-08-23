import type { Metadata } from 'next';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TrpcProvider } from '@/providers/TrpcProvider';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'VaultBill — Multi-Currency Invoicing',
  description: 'Self-hosted invoicing and compliance platform for multi-currency businesses',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var c=JSON.parse(localStorage.getItem('vaultbill-theme'));var m=c.mode||'system';var d=m==='system'?window.matchMedia('(prefers-color-scheme:dark)').matches:m==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.setAttribute('data-accent',c.accent||'sage');document.documentElement.setAttribute('data-radius',c.radius||'rounded');}catch(e){}})()`,
        }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <svg className="hidden" aria-hidden="true">
          <filter id="grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </svg>
        <ThemeProvider>
          <TrpcProvider>
            <span className="grain-overlay" aria-hidden="true" />
            {children}
          </TrpcProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}