// Member sign-in via the Wix-managed login flow (OAuth 2.0 + PKCE).
// Sign-in redirects straight to Google (idp option); Wix then redirects to
// /api/auth/callback/, which performs the token exchange (see callback.js)
// and returns here with the session persisted in localStorage.

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

async function memberDisplayName(wix) {
  try {
    const { member } = await wix.members.getCurrentMember();
    return member?.profile?.nickname || member?.contact?.firstName || member?.loginEmail || 'there';
  } catch (err) {
    console.error('Failed to fetch current member:', err);
    return 'there';
  }
}

export async function initAuth(wix) {
  const action = document.getElementById('auth-action');
  const greeting = document.getElementById('auth-greeting');

  if (wix.auth.loggedIn()) {
    greeting.textContent = `Hi, ${await memberDisplayName(wix)}`;
    greeting.hidden = false;
    action.textContent = 'Sign out';
  }
  action.disabled = false;

  action.addEventListener('click', async () => {
    action.disabled = true;
    try {
      if (wix.auth.loggedIn()) {
        const { logoutUrl } = await wix.auth.logout(window.location.href);
        localStorage.removeItem(SESSION_KEY);
        window.location.href = logoutUrl;
      } else {
        // Must exactly match an allowed redirect URI on the OAuth app.
        const callbackUri = new URL(`${import.meta.env.BASE_URL}api/auth/callback/`, window.location.origin).href;
        const originalUri = window.location.href.split(/[?#]/)[0];
        const oAuthData = wix.auth.generateOAuthData(callbackUri, originalUri);
        localStorage.setItem(OAUTH_KEY, JSON.stringify(oAuthData));
        // idp: 'google' skips the Wix login form and goes straight to Google.
        const { authUrl } = await wix.auth.getAuthUrl(oAuthData, { idp: 'google' });
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
      action.disabled = false;
    }
  });
}
