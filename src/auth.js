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
        await logoutMember(wix);
      } else {
        // Must exactly match an allowed redirect URI on the OAuth app.
        const callbackUri = new URL(`${import.meta.env.BASE_URL}api/auth/callback/`, window.location.origin).href;
        const here = window.location.href.split(/[?#]/)[0];
        const oAuthData = wix.auth.generateOAuthData(callbackUri, here);
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
