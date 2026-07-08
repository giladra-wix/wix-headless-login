import { createClient, OAuthStrategy } from '@wix/sdk';
import { products } from '@wix/stores';
import { services } from '@wix/bookings';
import { renderDashboard, dashboardError } from './dashboard.js';

// Demo client ID from the official Wix Headless tutorials.
// Replace with your own OAuth app client ID from
// Wix Dashboard → Settings → Headless Settings → OAuth Apps.
const CLIENT_ID = '10c1663b-2cdf-47c5-a3ef-30c2e8543849';

const wix = createClient({
  modules: { products, services },
  auth: OAuthStrategy({ clientId: CLIENT_ID }),
});

function mediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // wix:image://v1/<mediaId>/<filename>#originWidth=...&originHeight=...
  const wixImage = url.match(/^wix:image:\/\/v1\/([^/]+)\//);
  if (wixImage) return `https://static.wixstatic.com/media/${wixImage[1]}`;
  return `https://static.wixstatic.com/media/${url}`;
}

function card({ image, title, price, description }) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    ${image ? `<img src="${image}" alt="" loading="lazy" />` : '<div class="img-placeholder"></div>'}
    <div class="card-body">
      <h3></h3>
      ${price ? `<p class="price"></p>` : ''}
      <p class="desc"></p>
    </div>`;
  el.querySelector('h3').textContent = title;
  if (price) el.querySelector('.price').textContent = price;
  el.querySelector('.desc').textContent = description || '';
  return el;
}

function render(containerId, items) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  container.removeAttribute('aria-busy');
  if (!items.length) {
    container.innerHTML = '<p class="loading">Nothing here yet.</p>';
    return;
  }
  items.forEach((item) => container.append(card(item)));
}

function renderError(containerId, err) {
  const container = document.getElementById(containerId);
  container.removeAttribute('aria-busy');
  container.innerHTML = '<p class="error">Failed to load. See console for details.</p>';
  console.error(`Failed to load ${containerId}:`, err);
}

async function loadProducts() {
  try {
    const { items } = await wix.products.queryProducts().limit(100).find();
    try {
      renderDashboard(items);
    } catch (err) {
      dashboardError();
      console.error('Failed to render dashboard:', err);
    }
    render(
      'products',
      items.slice(0, 8).map((p) => ({
        image: mediaUrl(p.media?.mainMedia?.image?.url),
        title: p.name,
        price: p.priceData?.formatted?.price,
        description: p.description,
      })),
    );
  } catch (err) {
    renderError('products', err);
    dashboardError();
  }
}

async function loadServices() {
  try {
    const { items } = await wix.services.queryServices().limit(8).find();
    render(
      'services',
      items.map((s) => {
        const img = s.media?.mainMedia?.image;
        return {
          image: mediaUrl(typeof img === 'string' ? img : img?.url),
          title: s.name,
          price: s.payment?.fixed?.price
            ? `${s.payment.fixed.price.value} ${s.payment.fixed.price.currency}`
            : null,
          description: s.description,
        };
      }),
    );
  } catch (err) {
    renderError('services', err);
  }
}

loadProducts();
loadServices();
