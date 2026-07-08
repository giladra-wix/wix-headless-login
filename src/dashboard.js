// "Catalog at a glance" — stat tiles + horizontal bar chart of product prices.
// Single series (nominal categories), so every bar wears slot-1 blue and the
// title carries identity; values sit at bar tips and a table view twins the chart.

const VALUE_RESERVE = 64; // px kept clear at the track end so tip labels always fit

function money(value, currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value);
}

function niceScale(max) {
  const rough = max / 3;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return { top, ticks };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function statTile(label, value) {
  const tile = el('article', 'stat-tile');
  tile.append(el('p', 'stat-label', label), el('p', 'stat-value', value));
  return tile;
}

let tooltip;
function getTooltip() {
  if (!tooltip) {
    tooltip = el('div', 'viz-tooltip');
    tooltip.setAttribute('role', 'status');
    document.body.append(tooltip);
  }
  return tooltip;
}

function showTooltip(x, y, valueText, nameText) {
  const tip = getTooltip();
  tip.replaceChildren(el('span', 'viz-tooltip-value', valueText), el('span', 'viz-tooltip-name', nameText));
  tip.style.display = 'block';
  const { innerWidth } = window;
  const rect = tip.getBoundingClientRect();
  const left = Math.min(x + 12, innerWidth - rect.width - 8);
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${y - rect.height - 10 < 8 ? y + 16 : y - rect.height - 10}px`;
}

function hideTooltip() {
  if (tooltip) tooltip.style.display = 'none';
}

export function renderDashboard(products) {
  const section = document.getElementById('dashboard');
  const rows = products
    .map((p) => ({
      name: p.name,
      price: p.priceData?.price ?? 0,
      currency: p.priceData?.currency ?? 'EUR',
      inStock: p.stock?.inventoryStatus === 'IN_STOCK',
    }))
    .sort((a, b) => b.price - a.price);
  if (!rows.length) {
    section.hidden = true;
    return;
  }
  const currency = rows[0].currency;
  const total = rows.reduce((sum, r) => sum + r.price, 0);

  // KPI row
  const kpis = section.querySelector('#kpis');
  kpis.replaceChildren(
    statTile('Products', String(rows.length)),
    statTile('Catalog value', money(total, currency)),
    statTile('Average price', money(total / rows.length, currency)),
    statTile('In stock', `${rows.filter((r) => r.inStock).length} of ${rows.length}`),
  );

  // Chart
  const { top, ticks } = niceScale(Math.max(...rows.map((r) => r.price)));
  const chart = section.querySelector('#price-chart');
  chart.replaceChildren();

  const gridLayer = el('div', 'viz-grid-layer');
  ticks.slice(1).forEach((t) => {
    const line = el('div', 'viz-gridline');
    line.style.left = `calc((100% - ${VALUE_RESERVE}px) * ${t / top})`;
    gridLayer.append(line);
  });
  chart.append(gridLayer);

  rows.forEach((r) => {
    const row = el('div', 'viz-row');
    row.tabIndex = 0;
    const ratio = r.price / top;
    const label = el('span', 'viz-label', r.name);
    label.title = r.name;
    const track = el('div', 'viz-track');
    const bar = el('div', 'viz-bar');
    bar.style.width = `calc((100% - ${VALUE_RESERVE}px) * ${ratio})`;
    const value = el('span', 'viz-value', money(r.price, r.currency));
    value.style.left = `calc((100% - ${VALUE_RESERVE}px) * ${ratio} + 8px)`;
    track.append(bar, value);
    row.append(label, track);

    const tipText = () => [money(r.price, r.currency), r.name];
    row.addEventListener('pointermove', (e) => showTooltip(e.clientX, e.clientY, ...tipText()));
    row.addEventListener('pointerleave', hideTooltip);
    row.addEventListener('focus', () => {
      const rect = bar.getBoundingClientRect();
      showTooltip(rect.right, rect.top, ...tipText());
    });
    row.addEventListener('blur', hideTooltip);
    chart.append(row);
  });

  // X axis
  const axis = el('div', 'viz-axis');
  const axisTrack = el('div', 'viz-axis-track');
  ticks.forEach((t) => {
    const tick = el('span', 'viz-tick', money(t, currency).replace(/\.00$/, ''));
    tick.style.left = `calc((100% - ${VALUE_RESERVE}px) * ${t / top})`;
    axisTrack.append(tick);
  });
  axis.append(el('span'), axisTrack);
  chart.after(axis);

  // Table twin
  const tbody = section.querySelector('#price-table tbody');
  tbody.replaceChildren(
    ...rows.map((r) => {
      const tr = document.createElement('tr');
      tr.append(el('td', null, r.name), el('td', 'num', money(r.price, r.currency)), el('td', null, r.inStock ? 'In stock' : 'Out of stock'));
      return tr;
    }),
  );

  // Chart / table toggle
  const toggle = section.querySelector('#view-toggle');
  const chartView = section.querySelector('#chart-view');
  const tableView = section.querySelector('#table-view');
  toggle.addEventListener('click', () => {
    const showTable = tableView.hidden;
    tableView.hidden = !showTable;
    chartView.hidden = showTable;
    toggle.textContent = showTable ? 'View as chart' : 'View as table';
    toggle.setAttribute('aria-pressed', String(showTable));
  });

  section.querySelector('.loading')?.remove();
  section.removeAttribute('aria-busy');
}

export function dashboardError() {
  const section = document.getElementById('dashboard');
  section.hidden = true;
}
