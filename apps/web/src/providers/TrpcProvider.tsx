'use client';

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, type ReactNode } from 'react';

const trpcClient = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: (typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')) + '/api/trpc',
      fetch(url, opts) {
        const headers = new Headers(opts?.headers);
        if (typeof window !== 'undefined') {
          const impersonateTenantId = localStorage.getItem('vaultbill_impersonate_tenant');
          if (impersonateTenantId) {
            headers.set('x-impersonate-tenant-id', impersonateTenantId);
          }
        }
        return fetch(url, { ...opts, headers, credentials: 'include' });
      },
    }),
  ],
});

const TrpcClientContext = createContext(trpcClient);

export function useTrpcClient() {
  return useContext(TrpcClientContext);
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <TrpcClientContext.Provider value={trpcClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TrpcClientContext.Provider>
  );
}