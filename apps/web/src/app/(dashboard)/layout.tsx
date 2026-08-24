'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { VaultBillLogo } from '@/components/ui/logo';
import { Menu, X, Bell } from 'lucide-react';
import { BusinessProfileProvider, useBusinessProfile } from '@/context/business-profile-context';

function TenantLogoHeader() {
  const { profile, loading } = useBusinessProfile();

  // Derive initials for avatar fallback
  const initials = profile?.companyName
    ? profile.companyName.trim().slice(0, 2).toUpperCase()
    : null;

  if (loading) {
    return <div className="h-5 w-24 rounded bg-muted animate-pulse" />;
  }

  if (profile?.logoBase64) {
    return (
      <div className="flex items-center gap-2.5">
        <img
          src={profile.logoBase64}
          alt={profile.companyName || 'Company Logo'}
          className="h-7 max-w-[140px] object-contain"
          onError={(e) => {
            // If image fails to load, hide it so fallback renders
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {profile.companyName && (
          <span className="text-xs font-bold text-foreground hidden sm:inline truncate max-w-[180px]">
            {profile.companyName}
          </span>
        )}
      </div>
    );
  }

  if (initials) {
    return (
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
          {initials}
        </div>
        <span className="text-xs font-bold text-foreground hidden sm:inline truncate max-w-[180px]">
          {profile?.companyName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <VaultBillLogo className="size-5 text-accent" />
      <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
        Multi-Currency Suite
      </span>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <BusinessProfileProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64">
          <Sidebar />
        </div>

        {/* Mobile Drawer Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Offcanvas Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setMobileMenuOpen(false)} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:pl-64 min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-border bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground md:hidden"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              {/* Tenant logo / company name — mobile shows VaultBill icon only */}
              <div className="hidden md:flex">
                <TenantLogoHeader />
              </div>
              <div className="flex items-center gap-2 md:hidden">
                <VaultBillLogo className="size-5 text-accent" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>LIVE</span>
              </span>
            </div>
          </header>

          {/* Page Container */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-reveal-up">
            {children}
          </main>
        </div>
      </div>
    </BusinessProfileProvider>
  );
}