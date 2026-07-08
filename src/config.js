// OAuth app "GitHub Pages storefront" on the homegoods-premium site.
// Manage it in the Wix Dashboard → Settings → Headless Settings → OAuth Apps.
export const CLIENT_ID = '502745f4-c3c8-4c47-9c68-b9fbbf6cafc7';

// Custom SSO (OIDC) connection "SSO" on the homegoods-premium site, created
// via the IAM connections + OIDC-config internal APIs. The OIDC config points
// at Google's discovery document with placeholder client credentials — swap
// clientId/secret for a real IdP's (PATCH /nile/auto/v1/oidc-configs/{id}).
export const SSO_CONNECTION_ID = '6ce15ba1-cd8c-4fa8-8956-3ca07f482a81';
