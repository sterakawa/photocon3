/**
 * フォトコン ギャラリー（デモ・Bootstrap版）
 * - 分離: index.html / assets/style.css / assets/app.js
 * - ダミー画像: Picsum Photos
 * - 会場ごとにグリッド表示 / クリックでモーダル
 * - 無限スクロール / デモ自動追加
 */
(function(){
  // ===== 設定 =====
  const VENUES = ["会場A", "会場B", "会場C"]; // セクションの順序
  const PAGE_SIZE = 18;     // 1回のロードで追加する枚数
  const MORE_PAGES = 5;     // 追加ロードの最大回数

  // ===== 状態 =====
  const STATE = {
    groups: {},            // { venue: PhotoItem[] }
    page: 0,               // 読み込み済みページ
    canLoadMore: true,
    demoOn: false,
    demoIntervalMs: 4000,
    timer: null,
    active: null,          // モーダルで表示中のアイテム
    sortMode: 'new'        // 'new' | 'popular'
  };

  // ===== util =====
  function el(html){
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  // ===== 初期化 =====
  document.addEventListener('DOMContentLoaded', () => {
    // groups 初期化
    VENUES.forEach(v => STATE.groups[v] = []);

    // 先に空セクションを描画
    renderAll();

    // 初回ロード
    loadNextPage();

    // UIイベント
    const demoToggle = document.getElementById('demoToggle');
    const intervalInput = document.getElementById('intervalInput');
    const addOneBtn = document.getElementById('addOneBtn');
    const sentinel = document.getElementById('sentinel');

    // URLパラメータ
    const params = new URLSearchParams(location.search);
    if (params.get('demo') === '1') {
      demoToggle.checked = true;
      STATE.demoOn = true;
    }
    const rate = Number(params.get('rate')||'');
    if (!Number.isNaN(rate) && rate > 0) {
      intervalInput.value = String(rate);
      STATE.demoIntervalMs = Math.max(1000, rate*1000);
    }
    applyDemoTimer();

    // 並び替えタブ
    const tabNew = document.getElementById('tabNew');
    const tabPopular = document.getElementById('tabPopular');
    tabNew.addEventListener('click', (e)=>{ e.preventDefault(); setSortMode('new'); });
    tabPopular.addEventListener('click', (e)=>{ e.preventDefault(); setSortMode('popular'); });

    demoToggle.addEventListener('change', () => {
      STATE.demoOn = demoToggle.checked; applyDemoTimer();
    });
    intervalInput.addEventListener('change', () => {
      const secs = Math.max(1, Number(intervalInput.value||'1'));
      STATE.demoIntervalMs = secs*1000; applyDemoTimer();
    });
    addOneBtn.addEventListener('click', () => addDemoItem());

    // 無限スクロール
    const io = new IntersectionObserver((entries)=>{
      for(const e of entries){ if(e.isIntersecting){ loadNextPage(); } }
    }, { rootMargin: '600px 0px' });
    io.observe(sentinel);

    // モーダル準備
    const modalEl = document.getElementById('lightbox');
    STATE.modal = new bootstrap.Modal(modalEl);
    modalEl.addEventListener('hidden.bs.modal', ()=>{ STATE.active = null; });
  });

  function applyDemoTimer(){
    if(STATE.timer){ clearInterval(STATE.timer); STATE.timer=null; }
    if(STATE.demoOn){ STATE.timer = setInterval(()=>addDemoItem(), STATE.demoIntervalMs); }
  }

  function setSortMode(mode){
    STATE.sortMode = mode;
    // タブの見た目を更新
    document.getElementById('tabNew').classList.toggle('active', mode==='new');
    document.getElementById('tabNew').setAttribute('aria-selected', String(mode==='new'));
    document.getElementById('tabPopular').classList.toggle('active', mode==='popular');
    document.getElementById('tabPopular').setAttribute('aria-selected', String(mode==='popular'));
    // 再描画
    renderAll();
  }
    if(STATE.demoOn){ STATE.timer = setInterval(()=>addDemoItem(), STATE.demoIntervalMs); }
  }

  // 疑似ページ読み込み
  function loadNextPage(){
    if(!STATE.canLoadMore) return;
    const next = STATE.page + 1;
    if(next > MORE_PAGES){
      STATE.canLoadMore = false;
      document.getElementById('sentinel').textContent = '全ての作品を表示しました';
      return;
    }
    setLoading(true);
    setTimeout(()=>{
      const startIndex = (next-1)*PAGE_SIZE;
      const items = Array.from({length: PAGE_SIZE}).map((_, i)=>{
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
        const v = VENUES[(startIndex+i)%VENUES.length];
        const img = `https://picsum.photos/seed/${id}/900/900`;
        const thumb = `https://picsum.photos/seed/${id}/400/400`;
        return { id, venue:v, imageUrl:img, thumbUrl:thumb,
          title:`作品タイトル #${startIndex+i+1}`,
          author:`投稿者${((startIndex+i)%9)+1}`,
          takenAt:new Date(Date.now()-(startIndex+i)*86400000).toISOString(),
          likes: Math.floor(Math.random()*120) // 0-119 の仮人気度
        };
      });
      items.forEach(it=> STATE.groups[it.venue].push(it));
      STATE.page = next;
      setLoading(false); renderAll();
    }, 500);
  }

  // デモ: 会場に新着1件を先頭追加
  function addDemoItem(targetVenue){
    const venues = Object.keys(STATE.groups);
    const v = targetVenue || venues[Math.floor(Math.random()*Math.max(venues.length,1))] || '会場A';
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    const img = `https://picsum.photos/seed/${id}/900/900`;
    const thumb = `https://picsum.photos/seed/${id}/400/400`;
    const item = { id, venue:v, imageUrl:img, thumbUrl:thumb,
      title:`新着作品 ${new Date().toLocaleTimeString()}`,
      author:`demo-user${Math.floor(Math.random()*90)+10}`,
      takenAt:new Date().toISOString(),
      likes: Math.floor(Math.random()*120)
    };
    STATE.groups[v].unshift(item);
    renderVenue(v);
  }

  function setLoading(is){
    const s = document.getElementById('sentinel');
    s.textContent = is ? '読み込み中…' : 'さらに読み込む…';
  }

  // 全会場レンダリング
  function renderAll(){
    const root = document.getElementById('venues');
    root.innerHTML = '';
    for(const v of VENUES){ root.appendChild(renderVenueSection(v, STATE.groups[v])); }
  }

  // 単一会場差し替え
  function renderVenue(venue){
    const root = document.getElementById('venues');
    const old = document.getElementById(`section-${venue}`);
    const fresh = renderVenueSection(venue, STATE.groups[venue]);
    if(old){ root.replaceChild(fresh, old); } else { root.appendChild(fresh); }
  }

  // 会場セクション要素
  function renderVenueSection(venue, items){
    const section = el(`<section id="section-${venue}"></section>`);
    const header = el(`<div class="d-flex justify-content-between align-items-center mb-2">
      <h3 class="h5 m-0">${venue}</h3>
      <span class="badge text-bg-secondary badge-count">${items.length} 件</span>
    </div>`);

    // 並び替え
    const sorted = [...items];
    if (STATE.sortMode === 'popular') {
      sorted.sort((a,b)=> (b.likes||0)-(a.likes||0) || new Date(b.takenAt||0)-new Date(a.takenAt||0));
    } else { // 'new'
      sorted.sort((a,b)=> new Date(b.takenAt||0)-new Date(a.takenAt||0));
    }

    const grid = el(`<div class="row g-2 g-sm-3"></div>`);(`<div class="row g-2 g-sm-3"></div>`);
    sorted.forEach(item => {
      const col = el(`<div class="col-6 col-sm-4 col-md-3 col-lg-2"></div>`);
      const card = el(`<button type="button" class="w-100 border-0 bg-transparent p-0 text-start" aria-label="${escapeHtml(item.title||'写真を開く')}"></button>`);
      const thumbWrap = el(`<div class="card-thumb ratio ratio-1x1 shadow-sm position-relative"></div>`);
      const img = el(`<img class="w-100 h-100 object-fit-cover" loading="lazy" alt="${escapeHtml(item.title||'作品サムネイル')}">`);
      img.src = item.thumbUrl || item.imageUrl;
      thumbWrap.appendChild(img);
      const likeBadge = el(`<span class="badge text-bg-danger position-absolute top-0 end-0 m-2">♥ ${item.likes||0}</span>`);
      thumbWrap.appendChild(likeBadge);
      const overlay = el(`<div class="position-absolute bottom-0 start-0 end-0 p-2" style="background:linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 100%);">
        <div class="text-white small fw-semibold text-truncate">${escapeHtml(item.title||'タイトル未設定')}</div>
        <div class="text-white-50 small text-truncate">${escapeHtml(item.author||'投稿者非公開')}</div>
      </div>`);
      thumbWrap.appendChild(overlay);
      card.addEventListener('click', ()=> openLightbox(item));
      col.appendChild(card);
      card.appendChild(thumbWrap);
      grid.appendChild(col);
    });

    if(items.length === 0){
      const empty = el(`<div class="py-5 text-center text-muted small">まだ作品がありません</div>`);
      section.appendChild(header); section.appendChild(empty);
    } else {
      section.appendChild(header); section.appendChild(grid);
    }
    return section;
  }

  // Lightbox（Bootstrap Modal）
  function openLightbox(item){
    STATE.active = item;
    document.getElementById('lightboxImage').src = item.imageUrl;
    document.getElementById('lbTitle').textContent = item.title || 'タイトル未設定';
    document.getElementById('lbMeta').textContent  = `${item.author || '投稿者非公開'} ／ ${item.venue}`;
    document.getElementById('lbTakenAt').textContent = item.takenAt ? `撮影日: ${new Date(item.takenAt).toLocaleDateString()}` : '';
    STATE.modal.show();
  }
})();
