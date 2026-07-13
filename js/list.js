// 首頁:讀 data/quizzes.json,自動列出所有測驗卡片
(async function () {
  const root = document.getElementById('quiz-list');
  try {
    const res = await fetch('data/quizzes.json');
    const quizzes = await res.json();
    root.innerHTML = quizzes.map(q => `
      <a class="quiz-card" href="quiz.html?id=${encodeURIComponent(q.id)}">
        <div class="emoji">${q.emoji || '📝'}</div>
        <h3>${q.title}</h3>
        <p>${q.description}</p>
      </a>
    `).join('');
  } catch (e) {
    root.innerHTML = '<p class="loading">測驗清單載入失敗,請稍後再試。</p>';
  }
})();
