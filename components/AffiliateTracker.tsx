import React, { useEffect, useState } from 'react';
import { setReferralCode, getReferralCode } from '../lib/affiliate';

const AffiliateTracker: React.FC = () => {
  const [activeReferral, setActiveReferral] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const refParam = url.searchParams.get('ref');

    if (refParam) {
      setReferralCode(refParam);
      setActiveReferral(refParam);
    } else {
      const stored = getReferralCode();
      if (stored) setActiveReferral(stored);
    }
  }, []);

  if (!activeReferral) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 font-mono text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 border-t-2 border-l-2 border-brand-charcoal flex items-center gap-2">
      <span className="w-2 h-2 bg-brand-red animate-pulse"></span>
      CODE: {activeReferral}
    </div>
  );
};

export default AffiliateTracker;