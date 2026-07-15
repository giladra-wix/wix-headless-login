
# Wix Headless · Google Login

A minimal [static site](https://giladra-wix.github.io/wix-headless-login/) demonstrating member sign-in with Google on
[Wix Headless](https://dev.wix.com/docs/go-headless), deployed to GitHub Pages
with no server. Stripped-down copy of
[wix-headless-demo](https://github.com/giladra-wix/wix-headless-demo) — login only.

## How it works

- "Sign in with Google" runs the Wix-managed login flow (OAuth 2.0 + PKCE):
  `generateOAuthData()` → `getAuthUrl(oAuthData, { idp: 'google' })` skips the
  Wix login form and goes straight to Google.
- Wix redirects back to this page with `#code=` and `#state=` in the URL
  fragment; the exchange (`getMemberTokens` → `setTokens`) runs inline on load.
- Member tokens persist in `localStorage`; signed-in members see a greeting
  and a Sign out action.

The page's URL must be listed under the OAuth app's allowed authorization
redirect URIs, and Google login must be enabled in the site's member signup
settings.

## Local development

```sh
npm install
npm run dev
```
