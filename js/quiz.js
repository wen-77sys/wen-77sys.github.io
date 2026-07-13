// 通用測驗引擎:讀 quiz.html?id=xxx,載入 data/xxx.json 執行
// 目前支援 "dimensions"(MBTI 式,答案累加字母,各維度取多數)
(function () {
  const root = document.getElementById('quiz-root');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id || !/^[a-z0-9_-]+$/i.test(id)) {
    root.innerHTML = '<p class="loading">找不到這個測驗。<a href="index.html">回首頁</a></p>';
    return;
  }

  let data, answers, current = 0, scores = {};

  fetch('data/' + id + '.json')
    .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
    .then(d => { data = d; startQuiz(); })
    .catch(() => {
      root.innerHTML = '<p class="loading">測驗載入失敗。<a href="index.html">回首頁</a></p>';
    });

  function startQuiz() {
    document.title = data.title + ' — 心理測驗小站';
    answers = new Array(data.questions.length).fill(null);
    scores = {};
    current = 0;
    renderQuestion();
  }

  function renderQuestion() {
    const total = data.questions.length;
    const q = data.questions[current];
    const pct = Math.round((current / total) * 100);
    root.innerHTML = `
      <div class="quiz-head">
        <div class="emoji" style="font-size:2rem">${data.emoji || '📝'}</div>
        <h1>${data.title}</h1>
        <p>第 ${current + 1} / ${total} 題</p>
      </div>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="question">
        <h2>${q.q}</h2>
        <div class="options">
          ${q.options.map((opt, i) =>
            `<button class="option" data-i="${i}">${opt.text}</button>`
          ).join('')}
        </div>
      </div>
    `;
    root.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => choose(parseInt(btn.dataset.i, 10)));
    });
  }

  function choose(i) {
    const opt = data.questions[current].options[i];
    // 記錄這題的計分字母
    answers[current] = opt.score;
    current++;
    if (current < data.questions.length) {
      renderQuestion();
    } else {
      computeResult();
    }
  }

  function computeResult() {
    // 累加每個字母
    const tally = {};
    answers.forEach(s => { if (s) tally[s] = (tally[s] || 0) + 1; });

    let key, dims = null;
    if (data.type === 'dimensions') {
      // 每個維度是一組互斥字母,例如 "EI" -> 比較 E 與 I 誰多,並算出百分比
      dims = data.dimensions.map(pair => {
        const a = pair[0], b = pair[1];
        const ca = tally[a] || 0, cb = tally[b] || 0;
        const pa = (ca + cb) ? Math.round(ca / (ca + cb) * 100) : 50;
        return { a, b, pa, win: ca >= cb ? a : b };
      });
      key = dims.map(d => d.win).join('');
    } else {
      // 一般型:取得票數最高的字母當結果 key
      key = Object.keys(tally).sort((x, y) => tally[y] - tally[x])[0];
    }

    const result = data.results[key] || { title: '神秘型', desc: '你的答案組合很獨特！' };
    renderResult(key, result, dims);
  }

  // 維度字母的中文標籤(題庫可用 labels 欄位覆寫)
  const DIM_LABELS = { E: '外向', I: '內向', S: '實感', N: '直覺', T: '思考', F: '情感', J: '判斷', P: '感知' };

  function renderResult(key, result, dims) {
    // dimensions 型(如 MBTI)顯示四字母;一般型可在題庫用 badge 欄位放表情符號
    const badge = result.badge || key;
    const lbl = ch => (data.labels && data.labels[ch]) || DIM_LABELS[ch] || ch;

    // 維度百分比橫條(僅 dimensions 型)
    let dimsHtml = '';
    if (dims) {
      dimsHtml = '<div class="dims">' + dims.map(d => {
        const pb = 100 - d.pa;
        const aWin = d.pa >= 50;
        return `
          <div class="dim-row">
            <div class="dim-labels">
              <span class="${aWin ? 'win' : ''}">${lbl(d.a)} ${d.a}・${d.pa}%</span>
              <span class="${aWin ? '' : 'win'}">${pb}%・${d.b} ${lbl(d.b)}</span>
            </div>
            <div class="dim-bar${aWin ? '' : ' flip'}"><div style="width:${aWin ? d.pa : pb}%"></div></div>
          </div>`;
      }).join('') + '</div>';
    }

    // 配對彩蛋(僅 16 型的 dimensions 測驗):最速配=同一個 S/N 其餘全反,死對頭=四個字母全反
    let pairHtml = '';
    if (dims && key.length === 4) {
      const flip = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' };
      const matchKey = key.split('').map((c, i) => i === 1 ? c : flip[c]).join('');
      const clashKey = key.split('').map(c => flip[c]).join('');
      const m = data.results[matchKey], c = data.results[clashKey];
      if (m && c) {
        pairHtml = `
          <div class="pairs">
            <div class="pair"><div class="pair-tag">💘 最速配</div><div class="pair-type">${matchKey}</div><div class="pair-name">${m.title}</div></div>
            <div class="pair"><div class="pair-tag">⚡ 死對頭</div><div class="pair-type">${clashKey}</div><div class="pair-name">${c.title}</div></div>
          </div>
          <p class="pair-hint">把測驗傳給在意的人,看看你們是最速配還是死對頭 👀</p>`;
      }
    }

    const shareRaw = `我做了「${data.title}」,結果是「${result.title}」！你也來測測看： ${location.href}`;
    const shareUrl = encodeURIComponent(location.href);
    const lineHref = 'https://line.me/R/share?text=' + encodeURIComponent(shareRaw);
    const threadsHref = 'https://www.threads.net/intent/post?text=' + encodeURIComponent(shareRaw);
    root.innerHTML = `
      <div class="result">
        <div class="badge">${badge}</div>
        <h2>${result.title}</h2>
        ${dimsHtml}
        ${pairHtml}
        <div class="desc">${result.desc}</div>
        <div class="actions">
          <button class="btn share-img" id="save-card">📸 存成圖片</button>
          <a class="btn line" target="_blank" rel="noopener" href="${lineHref}">用 LINE 傳給朋友</a>
          <a class="btn fb" target="_blank" rel="noopener"
             href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}">分享到 Facebook</a>
          <a class="btn threads" target="_blank" rel="noopener" href="${threadsHref}">發到 Threads</a>
        </div>
        <div class="actions">
          <a class="btn secondary" href="quiz.html?id=${id}">再測一次</a>
          <a class="btn secondary" href="index.html">看其他測驗</a>
        </div>
      </div>
    `;
    const saveBtn = document.getElementById('save-card');
    if (saveBtn) saveBtn.addEventListener('click', () => saveCard(key, result, dims));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== 結果圖卡:把結果做成一張 1080 寬的 PNG,手機叫出分享選單、電腦直接下載 =====
  function buildCardEl(key, result, dims) {
    const lbl = ch => (data.labels && data.labels[ch]) || DIM_LABELS[ch] || ch;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:-99999px;top:0;width:1080px;padding:90px 90px 70px;box-sizing:border-box;' +
      'background:linear-gradient(160deg,#6c5ce7,#a29bfe);color:#fff;text-align:center;' +
      'font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;';
    const dimRows = (dims || []).map(d => {
      const aWin = d.pa >= 50;
      const w = aWin ? d.pa : 100 - d.pa;
      return `
        <div style="display:flex;justify-content:space-between;font-size:34px;margin:20px 0 10px">
          <span style="${aWin ? 'font-weight:700' : 'opacity:.75'}">${lbl(d.a)} ${d.a}・${d.pa}%</span>
          <span style="${aWin ? 'opacity:.75' : 'font-weight:700'}">${100 - d.pa}%・${d.b} ${lbl(d.b)}</span>
        </div>
        <div style="height:18px;background:rgba(255,255,255,.28);border-radius:99px;overflow:hidden;${aWin ? '' : 'transform:scaleX(-1);'}">
          <div style="height:100%;width:${w}%;background:#fff;border-radius:99px"></div>
        </div>`;
    }).join('');
    el.innerHTML = `
      <div style="font-size:38px;opacity:.9">🧠 心理測驗小站</div>
      <div style="font-size:46px;margin-top:30px">${data.title}</div>
      <div style="font-size:${(result.badge || key).length > 4 ? 140 : 150}px;font-weight:800;letter-spacing:6px;margin:46px 0 6px;line-height:1.15">${result.badge || key}</div>
      <div style="font-size:66px;font-weight:700;margin-bottom:46px">${result.title}</div>
      ${dimRows}
      <div style="font-size:36px;margin-top:72px;opacity:.92">你也來測 👉 wen-77sys.github.io</div>`;
    return el;
  }

  function downloadBlob(blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '我的測驗結果.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function saveCard(key, result, dims) {
    const btn = document.getElementById('save-card');
    if (btn) { btn.disabled = true; btn.textContent = '圖片製作中…'; }
    const done = () => { if (btn) { btn.disabled = false; btn.textContent = '📸 存成圖片'; } };
    // html2canvas 按需載入,不拖慢平常的測驗速度
    const ensureLib = window.html2canvas ? Promise.resolve() : new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
    ensureLib.then(() => {
      const card = buildCardEl(key, result, dims);
      document.body.appendChild(card);
      return window.html2canvas(card, { backgroundColor: null, scale: 1 })
        .then(canvas => { card.remove(); return new Promise(res => canvas.toBlob(res, 'image/png')); });
    }).then(blob => {
      if (!blob) throw new Error('no blob');
      window.__cardBlobSize = blob.size; // 供自動化測試驗證
      const file = new File([blob], 'my-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: data.title }).catch(() => downloadBlob(blob));
      }
      downloadBlob(blob);
    }).catch(() => {
      alert('圖片製作失敗,可以直接截圖分享喔！');
    }).finally(done);
  }
})();
