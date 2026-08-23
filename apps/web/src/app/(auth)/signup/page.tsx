'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultBillLogo } from '@/components/ui/logo';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const { error: err } = await authClient.signUp.email({ name, email, password });
    if (err) {
      setError(err.message || 'Something went wrong');
      return;
    }

    const slug = workspace.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    router.push(`/onboard?name=${encodeURIComponent(workspace)}&slug=${encodeURIComponent(slug)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Container size="xs">
        <Card padding="lg" className="text-center">
          <VaultBillLogo className="size-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">Create workspace</h1>
          <p className="text-muted-foreground text-sm mb-6">Start your VaultBill workspace</p>

          <form onSubmit={handleSubmit} className="text-left space-y-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
            <Input label="Workspace name" value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="My Business" required />

            {error && <p className="text-sm text-[hsl(var(--destructive-foreground))] bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full">Create workspace</Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            Already have one?{' '}
            <a href="/login" className="text-accent hover:underline">Sign in</a>
          </p>
        </Card>
      </Container>
    </main>
  );
}