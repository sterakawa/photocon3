// ダミーデータ（API連携時は置き換え）
const CONTESTS = [
  {
    id: 'summer24',
    title: 'サマー・トラベル 2025',
    venue: '会場A',
    period: '開催中 〜 2025/09/30',
    status: 'open', // open | soon | closed
    thumb: 'https://picsum.photos/seed/summer/960/540',
    tags: ['旅', '風景'],
    links: {
      rules: '#', result: '#', gallery: './index.html?contest=summer24'
    }
  },
  {
    id: 'food',
    title: 'おいしい瞬間',
    venue: '会場B',
    period: '近日開催 2025/10/05 〜',
    status: 'soon',
    thumb: 'https://picsum.photos/seed/food/960/540',
    tags: ['フード', '日常'],
    links: {
      rules: '#', result: '#', gallery: './index.html?contest=food'
    }
  },
  {
    id: 'mono',
    title: 'モノクロの世界',
    venue: '会場C',
    period: '終了 〜 2025/06/30',
    status: 'closed',
    thumb: 'https://picsum.photos/seed/mono/960/540',
    tags: ['モノクロ'],
    links: {
      rules: '#', result: '#', gallery: './index.html?contest=mono'
    }
  },
];

const NEWS = [
  { date: '2025-09-10', text: 'ポータルを公開しました。' },
  { date: '2025-09-15', text: '「サマー・トラベル 2025」を追加しました。' },
  { date: '2025-09-20', text: '近日開催「おいしい瞬間」を予告しました。' },
];

document.addEventListener('DOMContentLoaded', () => {
  renderContests(CONTESTS);
  renderNews(NEWS);

  // フィルタ
  const listEl = document.getElementById('contestList');
  const btns = {
    all:  document.getElementById('f-all'),
    open: document.getElementById('f-open'),
    soon: document.getElementById('f-soon'),
    closed: document.getElementById('f-closed'),
  };
  Object.entries(btns).forEach(([key, btn]) => {
    btn.addEventListener('click', () => {
      // active切り替え
      Object.values(btns).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (key === 'all') renderContests(CONTESTS);
      else renderContests(CONTESTS.filter(c => c.status === key));
      listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

function renderContests(items) {
  const root = document.getElementById('contestList');
  root.innerHTML = '';
  if (items.length === 0) {
    root.innerHTML = `<div class="col-12 text-muted small">該当するコンテストはありません。</div>`;
    return;
  }
  items.forEach(c => root.appendChild(contestCard(c)));
}

function badgeForStatus(st) {
  if (st === 'open')   return `<span class="badge bg-success-subtle text-success-emphasis badge-status">開催中</span>`;
  if (st === 'soon')   return `<span class="badge bg-warning-subtle text-warning-emphasis badge-status">近日</span>`;
  return `<span class="badge bg-secondary-subtle text-secondary-emphasis badge-status">終了</span>`;
}

function contestCard(c) {
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-lg-4';
  col.innerHTML = `
    <div class="card h-100 shadow-sm contest-card">
      <img class="thumb" src="${c.thumb}" alt="">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h3 class="h6 m-0">${c.title}</h3>
          ${badgeForStatus(c.status)}
        </div>
        <div class="text-muted small mb-2">${c.venue} ／ ${c.period}</div>
        <div class="mb-3">
          ${c.tags.map(t => `<span class="badge rounded-pill text-bg-light me-1">${t}</span>`).join('')}
        </div>
        <div class="mt-auto d-flex flex-wrap gap-2">
          <a class="btn btn-primary btn-sm" href="${c.links.gallery}">ギャラリーへ</a>
          <a class="btn btn-outline-secondary btn-sm" href="${c.links.rules}">募集要項</a>
          <a class="btn btn-outline-secondary btn-sm" href="${c.links.result}">結果発表</a>
        </div>
      </div>
    </div>
  `;
  return col;
}

function renderNews(list) {
  const root = document.getElementById('newsList');
  root.innerHTML = '';
  list.forEach(n => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span class="small">${n.text}</span>
      <span class="text-muted small">${n.date}</span>`;
    root.appendChild(li);
  });
}
