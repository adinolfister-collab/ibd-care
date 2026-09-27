import { base44 } from '@/api/base44Client';
import { clearSubscriptionCache } from '@/hooks/useSubscription';

// Runtime bridge to a native Google Play Billing plugin injected by the
// Android shell (e.g. a Capacitor plugin exposed as window.IBDCarePlayBilling).
// When absent (web/preview/iOS), checkout falls back to Stripe (external).
// This keeps the web build compliant: no in-app purchase via Stripe on Android.

function getBridge() {
  if (typeof window === 'undefined') return null;
  return (window.IBDCarePlayBilling) || null;
}

export function isPlayBillingAvailable() {
  return !!getBridge();
}

// Returns true once the native purchase flow succeeded and the backend
// verified the purchase.
export async function launchPlayBilling(plan) {
  const bridge = getBridge();
  if (!bridge) throw new Error('Play Billing non disponibile');
  const productId = plan === 'yearly'
    ? (bridge.yearlyProductId || 'premium_yearly')
    : (bridge.monthlyProductId || 'premium_monthly');
  const result = await bridge.launchBillingFlow({ productId });
  const purchaseToken = result?.purchaseToken || result?.purchase?.purchaseToken;
  if (!purchaseToken) throw new Error('Acquisto non completato');
  // Verify server-side; the backend activates the subscription on the profile.
  const res = await base44.functions.invoke('verifyPlayPurchase', { purchaseToken, productId });
  clearSubscriptionCache();
  return res.data;
}