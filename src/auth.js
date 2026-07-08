// Member sign-in via the Wix-managed login flow (OAuth 2.0 + PKCE), straight
// to Google. Wix redirects back to this page with #code= and #state= in the
// URL fragment; the exchange (getMemberTokens → setTokens) runs inline on load
// and the session persists in localStorage.

const SESSION_KEY = 'wixSession';
export const OAUTH_KEY = 'wixOAuthData';

export function storedTokens() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function persistTokens(wix) {
  const tokens = wix.auth.getTokens();
  if (tokens?.accessToken?.value) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
  }
}

// Logging a member out, per the Wix-managed login doc:
// https://dev.wix.com/docs/go-headless/self-managed-headless/authentication/members/wix-login-page/wix-managed-login-using-the-js-sdk#logging-a-member-out
// 1. Get the logout URL from the client — Wix ends the member's session there.
// 2. Clear the locally persisted session so this origin forgets the member.
// 3. Redirect to the logout URL; Wix sends the browser back to the URL passed in.
async function logoutMember(wix) {
  const forgetSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(OAUTH_KEY);
  };
  try {
    // auth.logout() creates a redirect session from the current member token
    // so Wix knows which session to terminate.
    const { logoutUrl } = await wix.auth.logout(window.location.href);
    forgetSession();
    window.location.href = logoutUrl;
  } catch (err) {
    // FAILED_TO_EXTRACT_SESSION: the token's session is already dead
    // (expired or revoked), so there is nothing to end server-side —
    // forget it locally and reload as an anonymous visitor.
    console.error('Server-side logout failed; clearing local session:', err);
    forgetSession();
    window.location.reload();
  }
}

async function memberDisplayName(wix) {
  try {
    const { member } = await wix.members.getCurrentMember();
    return member?.profile?.nickname || member?.contact?.firstName || member?.loginEmail || 'there';
  } catch (err) {
    console.error('Failed to fetch current member:', err);
    return 'there';
  }
}

import { SSO_CONNECTION_ID } from './config.js';

// Maps a button's data-idp to the SDK's IdentityProvider:
// 'google' | 'facebook' | { connectionId } for a custom SSO (OIDC) provider.
function identityProvider(key) {
  return key === 'sso' ? { connectionId: SSO_CONNECTION_ID } : key;
}

// Redirects to the chosen identity provider, skipping the Wix login form.
async function signIn(wix, idp) {
  // Must exactly match an allowed redirect URI on the OAuth app.
  const callbackUri = new URL(`${import.meta.env.BASE_URL}api/auth/callback/`, window.location.origin).href;
  const here = window.location.href.split(/[?#]/)[0];
  const oAuthData = wix.auth.generateOAuthData(callbackUri, here);
  localStorage.setItem(OAUTH_KEY, JSON.stringify(oAuthData));
  const { authUrl } = await wix.auth.getAuthUrl(oAuthData, { idp });
  window.location.href = authUrl;
}

export async function initAuth(wix) {
  const greeting = document.getElementById('auth-greeting');
  const signInButtons = document.getElementById('auth-buttons');
  const signOut = document.getElementById('auth-signout');
  const idpButtons = [...signInButtons.querySelectorAll('button[data-idp]')];

  if (wix.auth.loggedIn()) {
    greeting.textContent = `Hi, ${await memberDisplayName(wix)}`;
    greeting.hidden = false;
    signInButtons.hidden = true;
    signOut.hidden = false;
  }
  const enableButtons = () =>
    idpButtons.forEach((b) => {
      if (b.dataset.idp === 'sso' && !SSO_CONNECTION_ID) {
        b.title = 'Not configured — set SSO_CONNECTION_ID in src/config.js';
        return;
      }
      b.disabled = false;
    });
  enableButtons();

  idpButtons.forEach((button) =>
    button.addEventListener('click', async () => {
      idpButtons.forEach((b) => { b.disabled = true; });
      try {
        await signIn(wix, identityProvider(button.dataset.idp));
      } catch (err) {
        console.error('Sign-in failed:', err);
        enableButtons();
      }
    }),
  );

  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    try {
      await logoutMember(wix);
    } catch (err) {
      console.error('Sign-out failed:', err);
      signOut.disabled = false;
    }
  });
}
