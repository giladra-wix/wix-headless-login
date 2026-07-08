import { createClient, OAuthStrategy } from '@wix/sdk';
import { members } from '@wix/members';
import { CLIENT_ID } from './config.js';
import { initAuth, storedTokens } from './auth.js';

const wix = createClient({
  modules: { members },
  auth: OAuthStrategy({ clientId: CLIENT_ID, tokens: storedTokens() }),
});

initAuth(wix);
