// OAuth app "GitHub Pages storefront" on the homegoods-premium site.
// Manage it in the Wix Dashboard → Settings → Headless Settings → OAuth Apps.
export const CLIENT_ID = '502745f4-c3c8-4c47-9c68-b9fbbf6cafc7';

// Custom SSO (OIDC) connection ID. Wix has no public API for this — create the
// provider in the site dashboard: Settings → Signup & Login → Social login →
// add a custom (OIDC) provider, then paste its connection ID here.
// null hides nothing but keeps the SSO button disabled until configured.
export const SSO_CONNECTION_ID = null;
