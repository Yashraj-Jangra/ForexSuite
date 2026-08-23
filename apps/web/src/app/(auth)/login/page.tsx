'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultBillLogo } from '@/components/ui/logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const { error: err } = await authClient.signIn.email({ email, password });
    if (err) {
      setError(err.message || 'Invalid credentials');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Container size="xs">
        <Card padding="lg" className="text-center">
          <VaultBillLogo className="size-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-muted-foreground text-sm mb-6">Welcome back to VaultBill</p>

          <form onSubmit={handleSubmit} className="text-left space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />

            {error && <p className="text-sm text-[hsl(var(--destructive-foreground))] bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full">Sign in</Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <a href="/signup" className="text-accent hover:underline">Create one</a>
          </p>
        </Card>
      </Container>
    </main>
  );
}