// Shared logic for the "Founder" campaign. Used by joinFoundersCampaign,
// confirmFoundersSignup and seedExistingCommunityFounders so the rank/slot
// computation never diverges across functions.
//
// The campaign now offers ONLY 10 lifetime Founder slots (Premium a vita).
// The former 50-slot / 3-month tier has been removed.

export const CAMPAIGN = 'founders';
export const LIFETIME_SLOTS = 10;

export function isCampaignFull(confirmedCount: number): boolean {
  return confirmedCount >= LIFETIME_SLOTS;
}

// Orders confirmed signups by their first community message date (falling
// back to the signup created date) and returns a new array with sequential
// rank (1..N) and the matching slot_type (always 'lifetime').
export function assignRanks<T extends {
  id: string;
  confirmed?: boolean;
  first_message_date?: string | null;
  created_date?: string;
}>(confirmed: T[]): (T & { rank: number; slot_type: 'lifetime' })[] {
  const sorted = [...confirmed].sort((a, b) => {
    const ad = a.first_message_date || a.created_date || '';
    const bd = b.first_message_date || b.created_date || '';
    if (ad === bd) return 0;
    return ad < bd ? -1 : 1;
  });
  return sorted.map((s, i) => ({
    ...s,
    rank: i + 1,
    slot_type: 'lifetime' as const,
  }));
}

// Grant fields to write on the User profile for a confirmed Founder.
export function grantFieldsForRank(rank: number, now: Date = new Date()) {
  return {
    subscription_status: 'lifetime' as const,
    free_until: null,
    founder_rank: rank,
  };
}