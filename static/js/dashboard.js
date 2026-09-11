/* =========================================
   Dashboard — fetch, render, filter, modal
   ========================================= */
let allResponses   = [];
let ratingChart     = null;
let recommendChart  = null;
let banquetChart    = null;

if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);

const hideZero = v => v > 0 ? v : '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res  = await fetch('/api/responses');
    allResponses = await res.json();
  } catch {
    allResponses = [];
    showError('Could not load responses. Is the server running?');
  }

  updateStats(allResponses);
  renderChart(allResponses);
  renderRecommendChart(allResponses);
  renderBanquetChart(allResponses);
  renderTable(allResponses);

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filtered = filter(allResponses, btn.dataset.filter);
      renderTable(filtered);
    });
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Table click delegation
  document.getElementById('tableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-id]');
    if (row) openModal(row.dataset.id);
  });
});

/* ---------- data helpers ---------- */

function filter(responses, type) {
  return type === 'all' ? responses : responses.filter(r => r.form_type === type);
}

/* ---------- stats ---------- */

function updateStats(responses) {
  const pre     = responses.filter(r => r.form_type === 'pre');
  const post    = responses.filter(r => r.form_type === 'post');
  const ratings = post.map(r => r.rating).filter(n => Number.isFinite(n));
  const avg     = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;

  setText('statTotal',  responses.length);
  setText('statPre',    pre.length);
  setText('statPost',   post.length);
  setText('statRating', avg ? `${avg} ★` : '—');
}

/* ---------- chart ---------- */

function renderChart(responses) {
  const post   = responses.filter(r => r.form_type === 'post');
  const counts = [1, 2, 3, 4, 5].map(n => post.filter(r => r.rating === n).length);

  const ctx = document.getElementById('ratingChart').getContext('2d');
  if (ratingChart) ratingChart.destroy();

  ratingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
      datasets: [{
        label: 'Responses',
        data: counts,
        backgroundColor: ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#4ade80'],
        borderRadius: 7,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} response${ctx.parsed.y !== 1 ? 's' : ''}`,
          },
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#1e293b',
          font: { weight: '600' },
          formatter: hideZero,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grace: '15%',
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: '#f1f5f9' },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderRecommendChart(responses) {
  const post   = responses.filter(r => r.form_type === 'post');
  const groups = ['yes', 'maybe', 'no'];
  const counts = groups.map(g => post.filter(r => r.recommend === g).length);

  const ctx = document.getElementById('recommendChart').getContext('2d');
  if (recommendChart) recommendChart.destroy();

  recommendChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Yes', 'Maybe', 'No'],
      datasets: [{
        data: counts,
        backgroundColor: ['#4ade80', '#fcd34d', '#fca5a5'],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#fff',
          font: { weight: '600' },
          formatter: hideZero,
        },
      },
    },
  });
}

function renderBanquetChart(responses) {
  const pre    = responses.filter(r => r.form_type === 'pre');
  const groups = ['yes', 'no'];
  const counts = groups.map(g => pre.filter(r => r.attended_banquet === g).length);

  const ctx = document.getElementById('banquetChart').getContext('2d');
  if (banquetChart) banquetChart.destroy();

  banquetChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Yes', 'No'],
      datasets: [{
        data: counts,
        backgroundColor: ['#4ade80', '#fca5a5'],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#fff',
          font: { weight: '600' },
          formatter: hideZero,
        },
      },
    },
  });
}

/* ---------- table ---------- */

function renderTable(responses) {
  const tbody  = document.getElementById('tableBody');
  const noData = document.getElementById('noData');
  const count  = document.getElementById('tableCount');

  count.textContent = `${responses.length} entr${responses.length === 1 ? 'y' : 'ies'}`;

  if (responses.length === 0) {
    tbody.innerHTML = '';
    noData.hidden   = false;
    return;
  }

  noData.hidden  = true;
  tbody.innerHTML = responses.map(r => `
    <tr data-id="${esc(r.id)}">
      <td>${esc(r.name  || '—')}</td>
      <td>${esc(r.email || '—')}</td>
      <td><span class="badge badge-${r.form_type}">${r.form_type === 'pre' ? 'Pre-Feedback' : 'Post-Feedback'}</span></td>
      <td>${fmtDate(r.timestamp)}</td>
      <td><button class="expand-btn">View ›</button></td>
    </tr>
  `).join('');
}

/* ---------- modal ---------- */

function openModal(id) {
  const r = allResponses.find(x => String(x.id) === String(id));
  if (!r) return;

  const overlay = document.getElementById('modalOverlay');
  const body    = document.getElementById('modalBody');
  const title   = document.getElementById('modalTitle');

  title.textContent = r.form_type === 'pre' ? 'Pre-Feedback Details' : 'Post-Feedback Details';

  const fields = r.form_type === 'pre'
    ? [
        ['Name',                        r.name,  false],
        ['Email',                       r.email, false],
        ['Attended 2025 Banquet',       r.attended_banquet === 'yes' ? 'Yes' : r.attended_banquet === 'no' ? 'No' : '—', false],
        ['Submitted',                   fmtDate(r.timestamp), false],
        ['What Worked Well',            r.worked_well,       true],
        ['What Could Be Better',        r.improve_last_year, true],
        ['What to Keep / Repeat',       r.keep_repeat,       true],
        ['The One Change',              r.one_change,        true],
      ]
    : [
        ['Name',              r.name,    false],
        ['Email',             r.email,   false],
        ['Rating',            null,      false, r.rating],
        ['Recommend',         r.recommend, false],
        ['Submitted',         fmtDate(r.timestamp), false],
        ['What Went Well',    r.went_well, true],
        ['What to Improve',   r.improve,   true],
        ['Additional Comments', r.comments, true],
      ];

  body.innerHTML = `<div class="detail-grid">${fields.map(([label, value, full, rating]) => {
    const cls  = full ? 'detail-item full' : 'detail-item';
    const disp = rating != null
      ? `<span class="stars-display">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span> ${rating}/5`
      : esc(String(value ?? '—'));
    return `<div class="${cls}">
      <div class="detail-label">${label}</div>
      <div class="detail-value">${disp}</div>
    </div>`;
  }).join('')}</div>`;

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').hidden = true;
  document.body.style.overflow = '';
}

/* ---------- utils ---------- */

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function fmtDate(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

function showError(msg) {
  const tbody = document.getElementById('tableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--error);padding:2rem">${msg}</td></tr>`;
}
