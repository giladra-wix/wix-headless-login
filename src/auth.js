// Member sign-in via the Wix-managed login flow (OAuth 2.0 + PKCE), straight
// to Google. Wix redirects back to this page with #code= and #state= in the
// URL fragment; the exchange (getMemberTokens → setTokens) runs inline on load
// and the session persists in localStorage.

const SESSION_KEY = 'wixSession';
const OAUTH_KEY = 'wixOAuthData';

export function storedTokens() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? undefined;
  } catch {
    return undefined;
  }
}

function persistTokens(wix) {
  const tokens = wix.auth.getTokens();
  if (tokens?.accessToken?.value) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(tokens));
  }
}

async function handleLoginCallback(wix) {
  if (!/[#&](code|error)=/.test(window.location.hash)) return;
  const returned = wix.auth.parseFromUrl();
  history.replaceState(null, '', window.location.pathname + window.location.search);
  if (returned.error) {
    console.error('Login failed:', returned.errorDescription);
    return;
  }
  const oAuthData = JSON.parse(localStorage.getItem(OAUTH_KEY) || 'null');
  localStorage.removeItem(OAUTH_KEY);
  if (!oAuthData) return;
  const tokens = await wix.auth.getMemberTokens(returned.code, returned.state, oAuthData);
  wix.auth.setTokens(tokens);
  persistTokens(wix);
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

  try {
    await handleLoginCallback(wix);
  } catch (err) {
    console.error('Login callback failed:', err);
  }

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
        const here = window.location.href.split(/[?#]/)[0];
        const oAuthData = wix.auth.generateOAuthData(here, here);
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
