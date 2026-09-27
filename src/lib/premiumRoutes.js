// Route paths whose destination page exposes a Premium-gated feature.
// Used to show a lock indicator in navigation surfaces (SiteMenu, bottom nav).
// Scanner/Import live inside /esami (already gated in-page via PremiumLockedCard).
export const PREMIUM_ROUTES = new Set(['/esami', '/assistant']);
export const isPremiumRoute = (to) => PREMIUM_ROUTES.has(to);