const STORAGE_KEY = 'thaikick_referral';
const EXPIRY_DAYS = 30;




interface ReferralData {
  code: string;
  timestamp: number;
}

export const setReferralCode = (code: string) => {
  const data: ReferralData = {
    code,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getReferralCode = (): string | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: ReferralData = JSON.parse(stored);
    const now = Date.now();
    const diffMs = now - data.timestamp;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > EXPIRY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data.code;
  } catch (error) {
    console.error("Error parsing referral code", error);
    return null;
  }
};