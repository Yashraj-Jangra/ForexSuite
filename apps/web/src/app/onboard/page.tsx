'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultBillLogo } from '@/components/ui/logo';

export default function OnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get('name') || '');
  const [slug, setSlug] = useState(searchParams.get('slug') || '');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/trpc/createTenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Failed to create workspace');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Failed to connect to server');
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Container size="xs">
        <Card padding="lg" className="text-center">
          <VaultBillLogo className="size-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">Name your workspace</h1>
          <p className="text-muted-foreground text-sm mb-6">This will be your isolated workspace</p>

          <form onSubmit={handleSubmit} className="text-left space-y-4">
            <Input label="Workspace name" value={name} onChange={(e) => { setName(e.target.value); handleSlugChange(e.target.value); }} placeholder="My Business" required />
            <Input label="Slug" value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="my-business" required />

            {error && <p className="text-sm text-[hsl(var(--destructive-foreground))] bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full">Create workspace</Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}