'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultBillLogo } from '@/components/ui/logo';
import { Illustration } from '@/components/ui/illustration';
import { ArrowRight, Building2, Globe, ShieldAlert } from 'lucide-react';

export default function OnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get('name') || '');
  const [slug, setSlug] = useState(searchParams.get('slug') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/trpc/createTenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message || 'Failed to create workspace');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Failed to connect to server');
      setLoading(false);
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Container size="sm">
        <Card padding="lg" className="text-center border-border/80 shadow-2xl space-y-6">
          <div className="space-y-3">
            <Illustration name="onboarding" size="md" className="mx-auto drop-shadow-md" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Launch Your Workspace</h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Configure your dedicated multi-tenant organizational partition on VaultBill.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2 text-left">
              <ShieldAlert className="size-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="text-left space-y-4 max-w-md mx-auto">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Workspace / Business Name *</label>
              <div className="relative">
                <Building2 className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9-]/g, '-')) {
                      handleSlugChange(e.target.value);
                    }
                  }}
                  placeholder="e.g. S.P. Forex Private Limited"
                  required
                  className="pl-10 h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Workspace URL Slug *</label>
              <div className="relative">
                <Globe className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="sp-forex"
                  required
                  className="pl-10 h-10 text-xs font-mono"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Unique identifier used for subdomains, webhooks, and API keys.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-bold gap-2 mt-4 shadow-lg shadow-accent/20">
              {loading ? (
                <span>Initializing workspace...</span>
              ) : (
                <>
                  <span>Create Workspace &amp; Enter Dashboard</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}