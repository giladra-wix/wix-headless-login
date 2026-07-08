# Wix Headless Demo

A static storefront that fetches live products (Wix Stores) and booking services
(Wix Bookings) from a Wix site using [Wix Headless](https://dev.wix.com/docs/go-headless)
and the [`@wix/sdk`](https://dev.wix.com/docs/sdk) — deployed to GitHub Pages with
no server.

## How it works

- `@wix/sdk` authenticates as an anonymous visitor via `OAuthStrategy` using an
  OAuth app client ID (all client-side, safe to expose).
- Products and services are queried directly from the browser.
- Vite builds the site to static assets; a GitHub Actions workflow deploys them
  to GitHub Pages on every push to `main`.

## Point it at a different Wix site

The site currently uses the "GitHub Pages storefront" OAuth app on the
`homegoods-premium` site. To switch:

1. Open the target site's dashboard at [manage.wix.com](https://manage.wix.com)
   (any site with Stores/Bookings content works).
2. Go to **Settings → Headless Settings → OAuth Apps** and create an OAuth app.
3. Copy the client ID into `CLIENT_ID` in `src/main.js`.

## Local development

```sh
npm install
npm run dev
```
