// Shared logic for the "Founder" campaign. Used by joinFoundersCampaign,
// confirmFoundersSignup and seedExistingCommunityFounders so the rank/slot
// computation never diverges across functions.

export const CAMPAIGN = 'founders';
export const LIFETIME_SLOTS = 50;
export const TOTAL_SLOTS = 250;
export const THREE_MONTHS_DAYS = 90;

export function slotTypeForRank(rank: number): 'lifetime' | 'three_months' {
  return rank <= LIFETIME_SLOTS ? 'lifetime' : 'three_months';
}

export function isCampaignFull(confirmedCount: number): boolean {
  return confirmedCount >= TOTAL_SLOTS;
}

// Orders confirmed signups by their first community message date (falling
// back to the signup created date) and returns a new array with sequential
// rank (1..N) and the matching slot_type.
export function assignRanks<T extends {
  id: string;
  confirmed?: boolean;
  first_message_date?: string | null;
  created_date?: string;
}>(confirmed: T[]): (T & { rank: number; slot_type: 'lifetime' | 'three_months' })[] {
  const sorted = [...confirmed].sort((a, b) => {
    const ad = a.first_message_date || a.created_date || '';
    const bd = b.first_message_date || b.created_date || '';
    if (ad === bd) return 0;
    return ad < bd ? -1 : 1;
  });
  return sorted.map((s, i) => ({
    ...s,
    rank: i + 1,
    slot_type: slotTypeForRank(i + 1),
  }));
}

// Grant fields to write on the User profile for a confirmed Founder.
export function grantFieldsForRank(rank: number, now: Date = new Date()) {
  if (rank <= LIFETIME_SLOTS) {
    return {
      subscription_status: 'lifetime' as const,
      free_until: null,
      founder_rank: rank,
    };
  }
  const freeUntil = new Date(now.getTime() + THREE_MONTHS_DAYS * 86400000);
  return {
    subscription_status: 'three_months' as const,
    free_until: freeUntil.toISOString(),
    founder_rank: rank,
  };
}