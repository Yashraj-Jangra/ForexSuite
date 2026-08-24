'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type BusinessProfile = {
  id: string;
  companyName: string;
  logoBase64: string | null;
  signatureBase64: string | null;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  rbiLicenceNo: string;
  cin: string;
  pan: string;
  gstin: string;
  invoiceNumberFormat: string;
  defaultSacCode: string;
  defaultCgstRate: string;
  defaultSgstRate: string;
  defaultIgstRate: string;
  disclaimer1: string;
  disclaimer2: string;
};

type BusinessProfileContextType = {
  profile: BusinessProfile | null;
  loading: boolean;
  refresh: () => void;
};

const BusinessProfileContext = createContext<BusinessProfileContextType>({
  profile: null,
  loading: true,
  refresh: () => {},
});

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/trpc/businessProfile.get', { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data;
      if (data) setProfile(data);
    } catch {
      // silently fail — fallback to VaultBill branding
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <BusinessProfileContext.Provider value={{ profile, loading, refresh: fetchProfile }}>
      {children}
    </BusinessProfileContext.Provider>
  );
}

export function useBusinessProfile() {
  return useContext(BusinessProfileContext);
}
