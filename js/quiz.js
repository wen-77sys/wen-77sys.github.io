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

    let key;
    if (data.type === 'dimensions') {
      // 每個維度是一組互斥字母,例如 "EI" -> 比較 E 與 I 誰多
      key = data.dimensions.map(pair => {
        const a = pair[0], b = pair[1];
        return (tally[a] || 0) >= (tally[b] || 0) ? a : b;
      }).join('');
    } else {
      // 一般型:取得票數最高的字母當結果 key
      key = Object.keys(tally).sort((x, y) => tally[y] - tally[x])[0];
    }

    const result = data.results[key] || { title: '神秘型', desc: '你的答案組合很獨特！' };
    renderResult(key, result);
  }

  function renderResult(key, result) {
    // dimensions 型(如 MBTI)顯示四字母;一般型可在題庫用 badge 欄位放表情符號
    const badge = result.badge || key;
    const shareText = encodeURIComponent(`我做了「${data.title}」,結果是「${result.title}」！你也來測測看：`);
    const shareUrl = encodeURIComponent(location.href);
    root.innerHTML = `
      <div class="result">
        <div class="badge">${badge}</div>
        <h2>${result.title}</h2>
        <div class="desc">${result.desc}</div>
        <div class="actions">
          <a class="btn" target="_blank" rel="noopener"
             href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}">分享到 Facebook</a>
          <a class="btn secondary" href="quiz.html?id=${id}">再測一次</a>
          <a class="btn secondary" href="index.html">看其他測驗</a>
        </div>
      </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
})();
