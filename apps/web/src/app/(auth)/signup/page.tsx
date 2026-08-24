'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultBillLogo } from '@/components/ui/logo';
import { Illustration } from '@/components/ui/illustration';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Building2,
  User,
  Sparkles,
  ShieldAlert,
  Zap,
  LockKeyhole,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

  // If already authenticated, automatically forward to dashboard
  useEffect(() => {
    fetch('/api/trpc/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.result?.data) {
          router.replace('/dashboard');
        } else {
          setAuthChecking(false);
        }
      })
      .catch(() => setAuthChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: err } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (err) {
        setError(err.message || 'Failed to create account. Please check your details.');
        setLoading(false);
        return;
      }

      const slug = workspace.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      router.push(`/onboard?name=${encodeURIComponent(workspace.trim())}&slug=${encodeURIComponent(slug)}`);
    } catch {
      setError('An unexpected network error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Illustration name="connectedWorld" size="sm" float />
        <p className="text-xs font-semibold text-muted-foreground tracking-wider">
          Checking active workspace session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* ─── LEFT PANE: AUTHENTICATION FORM (48% on widescreen) ─── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-2xl mx-auto w-full lg:max-w-none lg:w-[48%]">
        {/* Top Bar: Brand & Theme Switcher */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <VaultBillLogo className="size-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-foreground">VaultBill</span>
              <span className="text-[10px] font-bold ml-1.5 px-1.5 py-0.5 rounded bg-accent/10 text-accent uppercase">
                FX Suite
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Toggle theme"
          >
            {mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>

        {/* Center Form Container */}
        <div className="my-auto py-8 max-w-md w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Create your workspace
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Launch your organization on VaultBill with automated RBI, FEMA, GST &amp; Multi-Currency invoicing.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
              <ShieldAlert className="size-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Full Legal Name</label>
              <div className="relative">
                <User className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yashraj Jangra"
                  required
                  className="pl-10 h-10 text-xs"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Work Email Address</label>
              <div className="relative">
                <Mail className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="pl-10 h-10 text-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Password (min 8 characters)</label>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="pl-10 pr-10 h-10 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Workspace / Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Company / Workspace Name</label>
              <div className="relative">
                <Building2 className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  placeholder="e.g. S.P. Forex &amp; Remittances"
                  required
                  className="pl-10 h-10 text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs font-bold gap-2 shadow-lg shadow-accent/20 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning workspace...</span>
                </div>
              ) : (
                <>
                  <span>Create Workspace &amp; Continue</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Sign In */}
          <div className="pt-2 text-center text-xs text-muted-foreground">
            Already have a workspace account?{' '}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-border/50 text-[11px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} VaultBill Technologies India</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <LockKeyhole className="size-3 text-emerald-400" />
              <span>Zero-Knowledge Data Isolation</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANE: RICH VISUAL SHOWCASE (52% on widescreen) ─── */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-12 flex-col justify-between overflow-hidden border-l border-border/60">
        {/* Background Mesh Gradient Orbs */}
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white text-xs font-semibold">
            <Zap className="size-3.5 text-accent" />
            <span>Instant Cloud &amp; Self-Host Ready</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70 font-mono">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Tenant Schema Isolation</span>
          </div>
        </div>

        {/* Center Showcase Graphic & Badges */}
        <div className="relative z-10 my-auto max-w-lg mx-auto w-full space-y-6 text-center">
          <div className="py-2">
            <Illustration name="connectedWorld" size="lg" className="mx-auto drop-shadow-2xl" />
          </div>

          {/* Card: 5 PDF Design Archetypes Showcase */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl space-y-3 text-left">
            <div className="flex items-center justify-between text-xs text-white font-bold border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <span>5 Customizable PDF Archetypes</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-mono">
                A4 Compliant
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/80">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="font-bold block text-white">Modern Minimalist</span>
                <span className="text-[10px] text-white/50 block">Sleek fintech layout with right-aligned summary card.</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="font-bold block text-white">Executive Slate</span>
                <span className="text-[10px] text-white/50 block">Tier-1 banking header band with dual-tone grid.</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="font-bold block text-white">Classic Heritage</span>
                <span className="text-[10px] text-white/50 block">Traditional double-border FFMC money changer look.</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="font-bold block text-white">Clean Monochrome</span>
                <span className="text-[10px] text-white/50 block">Swiss typography, zero color fills for thermal printing.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom statement */}
        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-white/60 flex items-center justify-between">
          <span>Enterprise Grade Multi-Tenant Currency &amp; Compliance Invoicing.</span>
          <div className="flex items-center gap-1 text-white/40 font-mono text-[10px]">
            <span>v0.2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}