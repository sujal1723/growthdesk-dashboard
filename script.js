
// GrowthDesk — Multi-page frontend demo
// All demo data is saved in this browser using localStorage.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE_KEY = "growthdesk-demo-v2";

const seed = {
  user: {
    name: "Alex Smith",
    email: "alex@growthdesk.demo",
    company: "GrowthDesk Inc."
  },
  customers: [
    { id: 1, name: "Jordan Davis", email: "jordan@example.com", date: "Nov 11, 2026", total: 240, status: "Active" },
    { id: 2, name: "Michelle Chen", email: "michelle@example.com", date: "Nov 10, 2026", total: 520, status: "Active" },
    { id: 3, name: "Robert Wilson", email: "robert@example.com", date: "Nov 10, 2026", total: 125, status: "Active" },
    { id: 4, name: "Sarah Lee", email: "sarah@example.com", date: "Nov 09, 2026", total: 890, status: "Inactive" }
  ],
  orders: [
    { id: "GD-1008", customer: "Jordan Davis", date: "Nov 11, 2026", amount: 240, status: "Paid" },
    { id: "GD-1007", customer: "Michelle Chen", date: "Nov 10, 2026", amount: 520, status: "Pending" },
    { id: "GD-1006", customer: "Robert Wilson", date: "Nov 10, 2026", amount: 125, status: "Paid" },
    { id: "GD-1005", customer: "Sarah Lee", date: "Nov 09, 2026", amount: 890, status: "Failed" },
    { id: "GD-1004", customer: "Olivia Martin", date: "Nov 08, 2026", amount: 310, status: "Paid" },
    { id: "GD-1003", customer: "Noah Brown", date: "Nov 07, 2026", amount: 180, status: "Paid" },
    { id: "GD-1002", customer: "Ava Garcia", date: "Nov 06, 2026", amount: 450, status: "Pending" },
    { id: "GD-1001", customer: "Ethan Taylor", date: "Nov 05, 2026", amount: 275, status: "Paid" }
  ],
  products: [
    { id: 1, name: "Starter Plan", category: "Subscription", price: 19, stock: 120 },
    { id: 2, name: "Growth Plan", category: "Subscription", price: 49, stock: 85 },
    { id: 3, name: "Pro Plan", category: "Subscription", price: 99, stock: 42 },
    { id: 4, name: "Consulting Session", category: "Service", price: 150, stock: 16 }
  ]
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.customers && saved.orders && saved.products) return saved;
  } catch (error) {
    console.warn("Could not read saved GrowthDesk data.", error);
  }
  return structuredClone(seed);
}

let state = loadState();
let activeChart = null;
let activeChannelChart = null;
let currentPage = location.hash.replace("#", "") || "overview";
let modalMode = null;
let editingId = null;

const money = value =>
  "$" + Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const initials = name =>
  String(name).trim().split(/\s+/).slice(0, 2)
    .map(part => part[0]).join("").toUpperCase();

const today = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  $("#topUser").textContent = state.user.name;
  $("#sidebarUser").textContent = state.user.name;
  $("#orderCount").textContent = state.orders.length;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function statusBadge(status) {
  const key = String(status).toLowerCase();
  return `<span class="status ${key}">${escapeHTML(status)}</span>`;
}

function pageHeading(title, subtitle, action = "") {
  return `
    <section class="heading">
      <div>
        <div class="eyebrow"><i></i> GROWTHDESK WORKSPACE</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="heading-buttons">${action}</div>
    </section>`;
}

function customerRows(list) {
  if (!list.length) {
    return `<tr><td colspan="5" class="empty-cell">No customers found.</td></tr>`;
  }

  return list.map(customer => `
    <tr>
      <td>
        <div class="customer">
          <div class="avatar purple">${escapeHTML(initials(customer.name))}</div>
          <div>
            <b>${escapeHTML(customer.name)}</b>
            <small>${escapeHTML(customer.email)}</small>
          </div>
        </div>
      </td>
      <td>${escapeHTML(customer.date)}</td>
      <td class="amount">${money(customer.total)}</td>
      <td>${statusBadge(customer.status)}</td>
      <td class="row-actions">
        <button class="table-action" data-action="edit-customer" data-id="${customer.id}">Edit</button>
        <button class="table-action danger" data-action="delete-customer" data-id="${customer.id}">Delete</button>
      </td>
    </tr>
  `).join("");
}

function orderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="5" class="empty-cell">No orders found.</td></tr>`;
  }

  return list.map(order => `
    <tr>
      <td><b class="order-id">${escapeHTML(order.id)}</b></td>
      <td>${escapeHTML(order.customer)}</td>
      <td>${escapeHTML(order.date)}</td>
      <td class="amount">${money(order.amount)}</td>
      <td>${statusBadge(order.status)}</td>
    </tr>
  `).join("");
}

function productRows(list) {
  if (!list.length) {
    return `<tr><td colspan="5" class="empty-cell">No products found.</td></tr>`;
  }

  return list.map(product => `
    <tr>
      <td><b>${escapeHTML(product.name)}</b></td>
      <td>${escapeHTML(product.category)}</td>
      <td class="amount">${money(product.price)}</td>
      <td>${Number(product.stock)}</td>
      <td class="row-actions">
        <button class="table-action" data-action="edit-product" data-id="${product.id}">Edit</button>
        <button class="table-action danger" data-action="delete-product" data-id="${product.id}">Delete</button>
      </td>
    </tr>
  `).join("");
}

function tablePanel(title, subtitle, headers, rows, id = "") {
  return `
    <article class="panel data-panel">
      <div class="panel-head">
        <div><h2>${title}</h2><p>${subtitle}</p></div>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody ${id ? `id="${id}"` : ""}>${rows}</tbody>
        </table>
      </div>
    </article>`;
}

// OVERVIEW PAGE

function renderOverview() {
  const revenue = state.orders
    .filter(o => o.status === "Paid")
    .reduce((sum, o) => sum + Number(o.amount), 0);

  return `
    ${pageHeading(
      `Good morning, ${escapeHTML(state.user.name.split(" ")[0])} ✦`,
      "Here's what's happening with your business today.",
      `<button class="btn secondary" data-action="export-orders">↓ Export report</button>
       <button class="btn primary" data-action="add-customer">＋ Add customer</button>`
    )}

    <section class="banner" id="banner">
      <div class="banner-icon">✦</div>
      <div>
        <b>Your workspace is ready!</b>
        <p>Your dashboard is powered by editable demo data stored in this browser.</p>
      </div>
      <button data-action="dismiss-banner" aria-label="Dismiss">×</button>
    </section>

    <section class="metrics">
      <article class="metric">
        <div class="metric-label">Paid revenue <span class="metric-icon violet">↗</span></div>
        <strong class="metric-value">${money(revenue)}</strong>
        <div class="metric-foot"><b class="up">Demo data</b> collected payments</div>
      </article>

      <article class="metric">
        <div class="metric-label">Total customers <span class="metric-icon blue">♙</span></div>
        <strong class="metric-value">${state.customers.length.toLocaleString()}</strong>
        <div class="metric-foot"><b class="up">Workspace</b> customer records</div>
      </article>

      <article class="metric">
        <div class="metric-label">Total orders <span class="metric-icon orange">▤</span></div>
        <strong class="metric-value">${state.orders.length.toLocaleString()}</strong>
        <div class="metric-foot"><b class="up">Workspace</b> order records</div>
      </article>

      <article class="metric">
        <div class="metric-label">Products <span class="metric-icon green">◇</span></div>
        <strong class="metric-value">${state.products.length.toLocaleString()}</strong>
        <div class="metric-foot"><b class="up">Catalogue</b> listed products</div>
      </article>
    </section>

    <section class="charts-grid">
      <article class="panel revenue-panel">
        <div class="panel-head">
          <div><h2>Revenue overview</h2><p>Paid order value in your demo workspace.</p></div>
          <select id="range">
            <option value="7">Last 7 days</option>
            <option value="30" selected>Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <div class="legend">
          <span><i class="dot violet-bg"></i>Revenue</span>
          <span><i class="dot gray-bg"></i>Previous period</span>
          <b id="chartTotal">${money(revenue)}</b>
        </div>
        <div class="chart-box"><canvas id="revenueChart"></canvas></div>
      </article>

      <article class="panel channel-panel">
        <div class="panel-head">
          <div><h2>Order status</h2><p>Breakdown of your current orders.</p></div>
        </div>
        <div class="donut-box">
          <canvas id="channelChart"></canvas>
          <div class="donut-label"><b>${state.orders.length}</b><span>Total orders</span></div>
        </div>
        <div class="channel-list">
          <div><span><i class="dot violet-bg"></i>Paid</span><b>${state.orders.filter(o => o.status === "Paid").length}</b></div>
          <div><span><i class="dot blue-bg"></i>Pending</span><b>${state.orders.filter(o => o.status === "Pending").length}</b></div>
          <div><span><i class="dot pink-bg"></i>Failed</span><b>${state.orders.filter(o => o.status === "Failed").length}</b></div>
        </div>
      </article>
    </section>

    <section class="lower-grid">
      ${tablePanel(
        "Recent customers",
        "Your latest customer records.",
        ["CUSTOMER", "DATE", "VALUE", "STATUS", "ACTIONS"],
        customerRows(state.customers.slice(0, 5)),
        "overviewCustomers"
      )}

      <article class="panel activity">
        <div class="panel-head">
          <div><h2>Quick actions</h2><p>Common workspace tasks.</p></div>
        </div>
        <div class="quick-actions">
          <button class="quick-action" data-action="add-customer">
            ＋ <span><b>Add a customer</b><small>Create a customer record</small></span> →
          </button>
          <button class="quick-action" data-action="add-product">
            ◇ <span><b>Add a product</b><small>Update your catalogue</small></span> →
          </button>
          <button class="quick-action" data-page-link="reports">
            ▥ <span><b>View reports</b><small>Export your workspace data</small></span> →
          </button>
        </div>
      </article>
    </section>

    <footer>
      <span>© 2026 GrowthDesk. Demo workspace.</span>
      <span>Made for smarter growth <b>✦</b></span>
    </footer>`;
}

// ANALYTICS PAGE

function renderAnalytics() {
  return `
    ${pageHeading("Analytics", "Explore revenue and order performance across your workspace.")}

    <section class="metrics">
      <article class="metric">
        <div class="metric-label">Paid revenue</div>
        <strong class="metric-value">${money(state.orders.filter(o => o.status === "Paid").reduce((s, o) => s + o.amount, 0))}</strong>
        <div class="metric-foot">From paid demo orders</div>
      </article>
      <article class="metric">
        <div class="metric-label">Average order value</div>
        <strong class="metric-value">${money(state.orders.length ? state.orders.reduce((s, o) => s + o.amount, 0) / state.orders.length : 0)}</strong>
        <div class="metric-foot">Across all orders</div>
      </article>
      <article class="metric">
        <div class="metric-label">Paid orders</div>
        <strong class="metric-value">${state.orders.filter(o => o.status === "Paid").length}</strong>
        <div class="metric-foot">Successful payments</div>
      </article>
      <article class="metric">
        <div class="metric-label">Pending orders</div>
        <strong class="metric-value">${state.orders.filter(o => o.status === "Pending").length}</strong>
        <div class="metric-foot">Awaiting payment</div>
      </article>
    </section>

    <section class="charts-grid analytics-charts">
      <article class="panel">
        <div class="panel-head">
          <div><h2>Revenue trend</h2><p>Illustrative trend for the selected period.</p></div>
          <select id="analyticsRange">
            <option value="7">7 days</option>
            <option value="30" selected>30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
        <div class="chart-box tall"><canvas id="analyticsRevenueChart"></canvas></div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div><h2>Order status</h2><p>Current order distribution.</p></div>
        </div>
        <div class="chart-box tall"><canvas id="analyticsStatusChart"></canvas></div>
      </article>
    </section>

    <div class="notice">Analytics are calculated from the sample orders in this browser. They are not connected to a live payment provider.</div>`;
}

// CUSTOMERS PAGE

function renderCustomers() {
  return `
    ${pageHeading(
      "Customers",
      "Manage the people who buy from your business.",
      `<button class="btn primary" data-action="add-customer">＋ Add customer</button>`
    )}

    <section class="panel data-panel">
      <div class="page-toolbar">
        <div><h2>All customers</h2><p>${state.customers.length} customer records</p></div>
        <input class="table-search" id="customerSearch" placeholder="Search customers...">
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>CUSTOMER</th><th>ADDED</th><th>ORDER VALUE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody id="customerRows">${customerRows(state.customers)}</tbody>
        </table>
      </div>
    </section>`;
}

// ORDERS PAGE

function renderOrders() {
  return `
    ${pageHeading(
      "Orders",
      "Review order history and payment statuses.",
      `<button class="btn secondary" data-action="export-orders">↓ Export orders</button>
       <button class="btn primary" data-action="add-order">＋ Add order</button>`
    )}

    <section class="panel data-panel">
      <div class="page-toolbar">
        <div><h2>All orders</h2><p>${state.orders.length} order records</p></div>
        <input class="table-search" id="orderSearch" placeholder="Search orders...">
        <select class="table-filter" id="orderFilter">
          <option value="All">All statuses</option>
          <option>Paid</option><option>Pending</option><option>Failed</option>
        </select>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
          <tbody id="orderRows">${orderRows(state.orders)}</tbody>
        </table>
      </div>
    </section>`;
}

// PRODUCTS PAGE

function renderProducts() {
  return `
    ${pageHeading(
      "Products",
      "Manage your product and service catalogue.",
      `<button class="btn primary" data-action="add-product">＋ Add product</button>`
    )}

    <section class="panel data-panel">
      <div class="page-toolbar">
        <div><h2>Product catalogue</h2><p>${state.products.length} products and services</p></div>
        <input class="table-search" id="productSearch" placeholder="Search products...">
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>ACTIONS</th></tr></thead>
          <tbody id="productRows">${productRows(state.products)}</tbody>
        </table>
      </div>
    </section>`;
}

// REPORTS PAGE

function renderReports() {
  const paid = state.orders
    .filter(o => o.status === "Paid")
    .reduce((sum, o) => sum + o.amount, 0);

  return `
    ${pageHeading("Reports", "Export a snapshot of your GrowthDesk demo workspace.")}

    <section class="report-grid">
      <article class="panel report-card">
        <div class="report-icon violet">▤</div>
        <h2>Orders report</h2>
        <p>Download all order IDs, customers, dates, amounts and statuses as a CSV file.</p>
        <button class="btn primary" data-action="export-orders">Download orders CSV ↓</button>
      </article>

      <article class="panel report-card">
        <div class="report-icon blue">♙</div>
        <h2>Customers report</h2>
        <p>Download your customer list, contact details, dates and order values.</p>
        <button class="btn primary" data-action="export-customers">Download customers CSV ↓</button>
      </article>

      <article class="panel report-card">
        <div class="report-icon green">✦</div>
        <h2>Workspace summary</h2>
        <p>
          Paid revenue: <b>${money(paid)}</b><br>
          Customers: <b>${state.customers.length}</b><br>
          Orders: <b>${state.orders.length}</b><br>
          Products: <b>${state.products.length}</b>
        </p>
        <button class="btn secondary" data-action="export-summary">Download summary CSV ↓</button>
      </article>
    </section>

    <div class="notice">CSV reports are generated in your browser using the current saved demo data.</div>`;
}

// SETTINGS PAGE

function renderSettings() {
  return `
    ${pageHeading("Settings", "Update your demo profile and workspace details.")}

    <section class="panel settings-panel">
      <div class="panel-head">
        <div><h2>Profile and workspace</h2><p>These details are saved locally in this browser.</p></div>
      </div>

      <form id="settingsForm" class="settings-form">
        <label>Full name
          <input name="name" required value="${escapeHTML(state.user.name)}">
        </label>
        <label>Email address
          <input name="email" type="email" required value="${escapeHTML(state.user.email)}">
        </label>
        <label>Workspace name
          <input name="company" required value="${escapeHTML(state.user.company)}">
        </label>
        <div class="form-actions">
          <button class="btn primary" type="submit">Save changes</button>
        </div>
      </form>
    </section>

    <section class="panel settings-panel">
      <div class="panel-head">
        <div><h2>Demo data</h2><p>Reset all customers, orders, products and profile details to the original sample data.</p></div>
      </div>
      <button class="btn secondary" data-action="reset-data">Reset demo workspace</button>
    </section>

    <div class="notice">This demo does not include real accounts, authentication, cloud sync or a backend database.</div>`;
}

// PAGE ROUTER

function renderPage(page = currentPage) {
  const allowed = ["overview", "analytics", "customers", "orders", "products", "reports", "settings"];

  if (!allowed.includes(page)) page = "overview";

  currentPage = page;

  const renderers = {
    overview: renderOverview,
    analytics: renderAnalytics,
    customers: renderCustomers,
    orders: renderOrders,
    products: renderProducts,
    reports: renderReports,
    settings: renderSettings
  };

  $("#pageContent").innerHTML = renderers[page]();
  $("#pageName").textContent = page[0].toUpperCase() + page.slice(1);

  $$(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  $("#sidebar").classList.remove("open");

  if (page === "overview") setupOverviewCharts();
  if (page === "analytics") setupAnalyticsCharts();

  saveState();
  bindPageControls();
}

// CHARTS

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#251b38",
        titleColor: "#fff",
        bodyColor: "#d5cbe4",
        borderColor: "#594578",
        borderWidth: 1,
        padding: 11
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#817890", maxRotation: 0 }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(205,188,255,.07)", drawTicks: false },
        border: { display: false },
        ticks: {
          color: "#817890",
          callback: value => "$" + (value >= 1000 ? (value / 1000).toFixed(0) + "k" : value)
        }
      }
    }
  };
}

const trendData = {
  7: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [4200, 5100, 4700, 6500, 5900, 7600, 8200]
  },
  30: {
    labels: ["Oct 13", "Oct 17", "Oct 21", "Oct 25", "Oct 29", "Nov 2", "Nov 6", "Nov 11"],
    values: [2800, 4200, 3600, 6100, 5200, 7600, 6800, 9200]
  },
  90: {
    labels: ["Aug", "Aug 12", "Aug 24", "Sep", "Sep 12", "Sep 24", "Oct", "Nov"],
    values: [12000, 14500, 13200, 17000, 18500, 21000, 24500, 29000]
  }
};

function makeLineChart(canvasId, rangeId, totalId) {
  const canvas = $("#" + canvasId);

  if (!canvas || !window.Chart) return null;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);

  gradient.addColorStop(0, "rgba(155,117,255,.28)");
  gradient.addColorStop(1, "rgba(155,117,255,0)");

  const rangeSelect = $("#" + rangeId);
  const initial = trendData[rangeSelect?.value || 30];

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: initial.labels,
      datasets: [
        {
          label: "Revenue",
          data: initial.values,
          borderColor: "#a77bff",
          backgroundColor: gradient,
          fill: true,
          tension: .42,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: "Previous period",
          data: initial.values.map(v => Math.round(v * .78)),
          borderColor: "#514660",
          borderDash: [5, 5],
          tension: .42,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: chartOptions()
  });

  if (rangeSelect) {
    rangeSelect.addEventListener("change", () => {
      const data = trendData[rangeSelect.value];

      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.values;
      chart.data.datasets[1].data = data.values.map(v => Math.round(v * .78));
      chart.update();

      if (totalId && $("#" + totalId)) {
        $("#" + totalId).textContent = money(data.values.reduce((a, b) => a + b, 0));
      }
    });
  }

  return chart;
}

function makeStatusChart(canvasId) {
  const canvas = $("#" + canvasId);

  if (!canvas || !window.Chart) return null;

  return new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Paid", "Pending", "Failed"],
      datasets: [{
        data: ["Paid", "Pending", "Failed"].map(
          status => state.orders.filter(o => o.status === status).length
        ),
        backgroundColor: ["#a77bff", "#6ea8ff", "#e68ad7"],
        borderWidth: 0,
        hoverOffset: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#bdb2ce",
            usePointStyle: true,
            padding: 18
          }
        }
      }
    }
  });
}

function setupOverviewCharts() {
  if (activeChart) activeChart.destroy();
  if (activeChannelChart) activeChannelChart.destroy();

  activeChart = makeLineChart("revenueChart", "range", "chartTotal");
  activeChannelChart = makeStatusChart("channelChart");
}

function setupAnalyticsCharts() {
  if (activeChart) activeChart.destroy();
  if (activeChannelChart) activeChannelChart.destroy();

  activeChart = makeLineChart("analyticsRevenueChart", "analyticsRange");
  activeChannelChart = makeStatusChart("analyticsStatusChart");
}

// ADD / EDIT MODALS

function openModal(mode, id = null) {
  modalMode = mode;
  editingId = id;

  const form = $("#recordForm");
  let title = "";
  let description = "";
  let fields = "";

  if (mode === "customer") {
    const item = id ? state.customers.find(x => x.id === id) : {};

    title = id ? "Edit customer" : "Add new customer";
    description = "Enter the customer's contact and account details.";

    fields = `
      <label>Full name
        <input name="name" required minlength="2" value="${escapeHTML(item?.name || "")}" placeholder="Taylor Morgan">
      </label>
      <label>Email address
        <input name="email" type="email" required value="${escapeHTML(item?.email || "")}" placeholder="taylor@example.com">
      </label>
      <label>Order value
        <div class="money-input">
          <span>$</span>
          <input name="total" type="number" min="0" step=".01" required value="${item?.total ?? ""}" placeholder="0.00">
        </div>
      </label>
      <label>Status
        <select name="status">
          <option ${item?.status === "Active" ? "selected" : ""}>Active</option>
          <option ${item?.status === "Inactive" ? "selected" : ""}>Inactive</option>
        </select>
      </label>`;
  }

  else if (mode === "product") {
    const item = id ? state.products.find(x => x.id === id) : {};

    title = id ? "Edit product" : "Add product";
    description = "Add a product or service to your catalogue.";

    fields = `
      <label>Product name
        <input name="name" required value="${escapeHTML(item?.name || "")}" placeholder="Product name">
      </label>
      <label>Category
        <input name="category" required value="${escapeHTML(item?.category || "")}" placeholder="e.g. Subscription">
      </label>
      <label>Price
        <div class="money-input">
          <span>$</span>
          <input name="price" type="number" min="0" step=".01" required value="${item?.price ?? ""}">
        </div>
      </label>
      <label>Stock / available units
        <input name="stock" type="number" min="0" step="1" required value="${item?.stock ?? ""}">
      </label>`;
  }

  else if (mode === "order") {
    title = "Add order";
    description = "Create a sample order for an existing customer.";

    fields = `
      <label>Customer
        <select name="customer" required>
          ${state.customers.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("")}
        </select>
      </label>
      <label>Amount
        <div class="money-input">
          <span>$</span>
          <input name="amount" type="number" min="0" step=".01" required placeholder="0.00">
        </div>
      </label>
      <label>Payment status
        <select name="status">
          <option>Paid</option>
          <option>Pending</option>
          <option>Failed</option>
        </select>
      </label>`;
  }

  $("#modalTitle").textContent = title;
  $("#modalDescription").textContent = description;
  $("#modalEyebrow").textContent = mode.toUpperCase() + " MANAGEMENT";

  form.innerHTML = fields + `
    <div class="modal-actions">
      <button type="button" class="btn secondary" data-action="close-modal">Cancel</button>
      <button type="submit" class="btn primary">${id ? "Save changes" : "Add"} →</button>
    </div>`;

  $("#modal").classList.add("open");
  $("#modal").setAttribute("aria-hidden", "false");

  $("input,select", form)?.focus();
}

function closeModal() {
  $("#modal").classList.remove("open");
  $("#modal").setAttribute("aria-hidden", "true");
  $("#recordForm").innerHTML = "";
  modalMode = null;
  editingId = null;
}

function handleRecordSubmit(event) {
  event.preventDefault();

  const values = Object.fromEntries(new FormData(event.currentTarget).entries());

  if (modalMode === "customer") {
    const oldCustomer = state.customers.find(c => c.id === editingId);

    const record = {
      id: editingId ?? Date.now(),
      name: values.name.trim(),
      email: values.email.trim(),
      date: oldCustomer ? oldCustomer.date : today(),
      total: Number(values.total),
      status: values.status
    };

    if (editingId) {
      state.customers = state.customers.map(c => c.id === editingId ? record : c);
    } else {
      state.customers.unshift(record);
    }

    showToast(editingId ? "Customer updated." : "Customer added.");
  }

  else if (modalMode === "product") {
    const record = {
      id: editingId ?? Date.now(),
      name: values.name.trim(),
      category: values.category.trim(),
      price: Number(values.price),
      stock: Number(values.stock)
    };

    if (editingId) {
      state.products = state.products.map(p => p.id === editingId ? record : p);
    } else {
      state.products.unshift(record);
    }

    showToast(editingId ? "Product updated." : "Product added.");
  }

  else if (modalMode === "order") {
    state.orders.unshift({
      id: "GD-" + Date.now().toString().slice(-6),
      customer: values.customer,
      date: today(),
      amount: Number(values.amount),
      status: values.status
    });

    showToast("Order added.");
  }

  saveState();
  closeModal();
  renderPage(currentPage);
}

// CSV EXPORTS

function downloadCSV(filename, rows) {
  const csv = rows.map(row =>
    row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
  showToast("Your CSV report has been downloaded.");
}

function exportOrders() {
  downloadCSV("growthdesk-orders.csv", [
    ["Order ID", "Customer", "Date", "Amount", "Status"],
    ...state.orders.map(o => [o.id, o.customer, o.date, o.amount, o.status])
  ]);
}

function exportCustomers() {
  downloadCSV("growthdesk-customers.csv", [
    ["Name", "Email", "Date added", "Order value", "Status"],
    ...state.customers.map(c => [c.name, c.email, c.date, c.total, c.status])
  ]);
}

// SEARCH AND FILTERS

function filterTable(inputId, rowsId) {
  const input = $("#" + inputId);
  const body = $("#" + rowsId);

  if (!input || !body) return;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();

    $$("tr", body).forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
    });
  });
}

function bindPageControls() {
  filterTable("customerSearch", "customerRows");
  filterTable("productSearch", "productRows");

  const orderSearch = $("#orderSearch");
  const orderFilter = $("#orderFilter");

  const filterOrders = () => {
    const query = orderSearch?.value.toLowerCase() || "";
    const status = orderFilter?.value || "All";

    $$("#orderRows tr").forEach(row => {
      const matchesText = row.textContent.toLowerCase().includes(query);
      const matchesStatus = status === "All" || row.textContent.includes(status);

      row.style.display = matchesText && matchesStatus ? "" : "none";
    });
  };

  orderSearch?.addEventListener("input", filterOrders);
  orderFilter?.addEventListener("change", filterOrders);

  $("#settingsForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const values = Object.fromEntries(new FormData(event.currentTarget).entries());

    state.user = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim()
    };

    $(".workspace b").textContent = state.user.company;

    saveState();
    showToast("Settings saved.");
    renderPage("settings");
  });
}

// BUTTON ACTIONS

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-page]");

  if (nav) {
    event.preventDefault();
    location.hash = nav.dataset.page;
    renderPage(nav.dataset.page);
    return;
  }

  const pageLink = event.target.closest("[data-page-link]");

  if (pageLink) {
    location.hash = pageLink.dataset.pageLink;
    renderPage(pageLink.dataset.pageLink);
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  const id = Number(actionEl.dataset.id);

  if (action === "add-customer") openModal("customer");
  if (action === "add-product") openModal("product");

  if (action === "add-order") {
    state.customers.length
      ? openModal("order")
      : showToast("Add a customer before creating an order.");
  }

  if (action === "close-modal") closeModal();

  if (action === "edit-customer") openModal("customer", id);
  if (action === "edit-product") openModal("product", id);

  if (action === "delete-customer" && confirm("Delete this customer record?")) {
    state.customers = state.customers.filter(c => c.id !== id);
    saveState();
    renderPage("customers");
    showToast("Customer deleted.");
  }

  if (action === "delete-product" && confirm("Delete this product?")) {
    state.products = state.products.filter(p => p.id !== id);
    saveState();
    renderPage("products");
    showToast("Product deleted.");
  }

  if (action === "export-orders") exportOrders();
  if (action === "export-customers") exportCustomers();

  if (action === "export-summary") {
    downloadCSV("growthdesk-summary.csv", [
      ["Metric", "Value"],
      ["Customers", state.customers.length],
      ["Orders", state.orders.length],
      ["Products", state.products.length],
      ["Paid revenue", state.orders.filter(o => o.status === "Paid").reduce((s, o) => s + o.amount, 0)]
    ]);
  }

  if (action === "dismiss-banner") {
    actionEl.closest(".banner")?.remove();
  }

  if (action === "reset-data" && confirm("Reset all GrowthDesk demo data? This will remove your local changes.")) {
    state = structuredClone(seed);
    saveState();
    $(".workspace b").textContent = state.user.company;
    renderPage("settings");
    showToast("Demo workspace reset.");
  }
});

// GLOBAL EVENT LISTENERS

$("#recordForm").addEventListener("submit", handleRecordSubmit);
$("#closeModal").addEventListener("click", closeModal);

$("#modal").addEventListener("click", event => {
  if (event.target === $("#modal")) closeModal();
});

$("#mobileMenu").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

document.addEventListener("click", event => {
  if (
    window.innerWidth <= 850 &&
    $("#sidebar").classList.contains("open") &&
    !$("#sidebar").contains(event.target) &&
    !$("#mobileMenu").contains(event.target)
  ) {
    $("#sidebar").classList.remove("open");
  }
});

$("#notifications").addEventListener("click", () => {
  showToast("You're all caught up. No new notifications.");
});

$("#globalSearch").addEventListener("input", event => {
  const query = event.target.value.toLowerCase();
  const table = $("#pageContent table tbody");

  if (table) {
    $$("#pageContent tbody tr").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
    });
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#globalSearch").focus();
  }
});

window.addEventListener("hashchange", () => {
  renderPage(location.hash.replace("#", "") || "overview");
});

// INITIALIZE APP

$(".workspace b").textContent = state.user.company;
saveState();
renderPage(currentPage);
