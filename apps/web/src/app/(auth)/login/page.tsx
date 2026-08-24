'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VaultBillLogo } from '@/components/ui/logo';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Globe2,
  TrendingUp,
  FileCheck2,
  LockKeyhole,
  Check,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      const { error: err } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (err) {
        setError(err.message || 'Invalid email or password. Please check your credentials.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('An unexpected network error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="size-12 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center animate-pulse">
          <VaultBillLogo className="size-6 text-accent" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wider">
          Checking active workspace session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* ─── LEFT PANE: AUTHENTICATION FORM (45% on widescreen) ─── */}
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
              Sign in to workspace
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Enter your credentials to access your multi-currency invoicing &amp; statutory compliance suite.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
              <ShieldCheck className="size-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="pl-10 h-11 text-xs"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Password</label>
              </div>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pl-10 pr-10 h-11 text-xs font-mono"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input text-accent focus:ring-accent size-3.5"
                />
                <span>Remember this device for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs font-bold gap-2 shadow-lg shadow-accent/20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Sign Up */}
          <div className="pt-2 text-center text-xs text-muted-foreground">
            Don&apos;t have a workspace account?{' '}
            <Link href="/signup" className="text-accent font-bold hover:underline">
              Create a workspace
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-border/50 text-[11px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} VaultBill Technologies India</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <LockKeyhole className="size-3 text-emerald-400" />
              <span>256-Bit Encrypted</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANE: RICH VISUAL SHOWCASE (52% on widescreen) ─── */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-12 flex-col justify-between overflow-hidden border-l border-border/60">
        {/* Background Mesh Gradient Orbs */}
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles className="size-3.5 text-accent" />
            <span>Next-Gen Multi-Currency Compliance Suite</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70 font-mono">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RBI Reference Rates Live</span>
          </div>
        </div>

        {/* Center Showcase Mockup Cards */}
        <div className="relative z-10 my-auto max-w-lg mx-auto w-full space-y-4">
          {/* Glass Card 1: Forex Rates Live Widget */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60 font-semibold border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-white">
                <Globe2 className="size-4 text-accent" />
                <span>Forex Rates &amp; Cash Memo Engine</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Feed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-white">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] text-white/50 block font-mono">USD / INR</span>
                <span className="text-sm font-bold block">₹86.45</span>
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="size-2.5" /> +0.12%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] text-white/50 block font-mono">GBP / INR</span>
                <span className="text-sm font-bold block">₹111.20</span>
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="size-2.5" /> +0.08%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] text-white/50 block font-mono">EUR / INR</span>
                <span className="text-sm font-bold block">₹93.80</span>
                <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="size-2.5" /> +0.05%
                </span>
              </div>
            </div>
          </div>

          {/* Glass Card 2: 5-Pillar Compliance Grid */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <FileCheck2 className="size-4 text-emerald-400" />
              <span>Full Statutory Regulatory Automation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/80">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                <Check className="size-3.5 text-accent" />
                <span>FLM-1 to FLM-8 RBI Registers</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                <Check className="size-3.5 text-accent" />
                <span>LRS Form A2 &amp; TCS 20% Math</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                <Check className="size-3.5 text-accent" />
                <span>e-FIRC &amp; EDPMS Matching</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                <Check className="size-3.5 text-accent" />
                <span>5 Multi-Style PDF Templates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial / Trust Statement */}
        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-white/60 flex items-center justify-between">
          <span>Trusted by Authorized Dealers, FFMC Licenced Money Changers &amp; Tech Exporters.</span>
          <div className="flex items-center gap-1 text-white/40 font-mono text-[10px]">
            <span>v0.2.4 Production</span>
          </div>
        </div>
      </div>
    </div>
  );
}