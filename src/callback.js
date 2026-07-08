// /api/auth/callback — Step 5 of the Wix-managed login flow (token exchange).
// Wix redirects here with #code= and #state= in the URL fragment. This page
// exchanges the code for member tokens and returns to where login started.
// https://dev.wix.com/docs/go-headless/self-managed-headless/authentication/members/wix-login-page/wix-managed-login-using-the-js-sdk#step-5--perform-token-exchange

import { createClient, OAuthStrategy } from '@wix/sdk';
import { CLIENT_ID } from './config.js';
import { OAUTH_KEY, persistTokens } from './auth.js';

const myWixClient = createClient({ auth: OAuthStrategy({ clientId: CLIENT_ID }) });

const home = new URL(import.meta.env.BASE_URL, window.location.origin).href;

async function exchangeTokens() {
  const returnedOAuthData = myWixClient.auth.parseFromUrl();
  const oAuthData = JSON.parse(localStorage.getItem(OAUTH_KEY) || 'null');
  localStorage.removeItem(OAUTH_KEY);

  if (returnedOAuthData.error) {
    throw new Error(returnedOAuthData.errorDescription || returnedOAuthData.error);
  }
  if (!returnedOAuthData.code || !oAuthData) {
    throw new Error('Missing authorization code or stored OAuth data.');
  }

  const tokens = await myWixClient.auth.getMemberTokens(
    returnedOAuthData.code,
    returnedOAuthData.state,
    oAuthData,
  );
  myWixClient.auth.setTokens(tokens);
  persistTokens(myWixClient);

  window.location.replace(oAuthData.originalUri || home);
}

exchangeTokens().catch((err) => {
  console.error('Token exchange failed:', err);
  document.getElementById('status').textContent = 'Sign-in failed';
  document.querySelector('.subtitle').textContent = 'Taking you back to the storefront…';
  setTimeout(() => window.location.replace(home), 2000);
});
