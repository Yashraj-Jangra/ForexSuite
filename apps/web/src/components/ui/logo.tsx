export function VaultBillLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="10" fill="currentColor" className="text-accent" />
      <path
        d="M10 14h12a3 3 0 110 6H12a1 1 0 100 2h10M16 10v12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="10" r="2" fill="white" />
    </svg>
  );
}