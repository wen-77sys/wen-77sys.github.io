# 心理測驗小站 — 起手網站

一個用純 HTML / CSS / JavaScript 做的心理測驗網站,設計成「**一個引擎、多份題庫**」:要新增測驗,只要多丟一個 JSON 檔,不用改程式。已預留 Google AdSense 廣告版位。

## 檔案結構

```
ad-quiz-site/
├── index.html          首頁(自動列出所有測驗)
├── quiz.html           測驗頁(?id=mbti 讀對應題庫)
├── about.html          關於本站(AdSense 需要)
├── privacy.html        隱私權政策(AdSense 必備!)
├── css/style.css       樣式
├── js/list.js          首頁列表邏輯
├── js/quiz.js          測驗引擎
└── data/
    ├── quizzes.json    測驗清單(首頁用)
    └── mbti.json       MBTI 題庫(範本)
```

## 在本機看效果

因為用到 fetch 讀 JSON,直接雙擊 index.html 會被瀏覽器擋。要用本機小伺服器:

```powershell
# 在 ad-quiz-site 資料夾裡執行(需已安裝 Python)
python -m http.server 8000
```
然後開瀏覽器到 http://localhost:8000

## 怎麼新增一個測驗(重點!)

1. 在 `data/` 複製 `mbti.json` 改成新檔,例如 `data/love.json`,改裡面的題目和結果。
2. 打開 `data/quizzes.json`,加一筆:
   ```json
   { "id": "love", "emoji": "💗", "title": "戀愛人格測驗", "description": "測測你的戀愛風格。" }
   ```
3. 存檔,重新整理首頁就出現了。完全不用碰程式。

> ⚠️ 提醒:不要只是把同一份題目換皮灌很多個。Google AdSense 會判定重複、低價值內容而拒絕。寧可先做 5~10 個「真的不一樣」的測驗。

## 部署到 GitHub Pages(免費上線)

1. 到 https://github.com 註冊 / 登入,建一個新的 repository(例如 `quiz-site`),設為 Public。
2. 把 `ad-quiz-site` 資料夾裡的**所有檔案**上傳(可用網頁的 "Add file → Upload files" 拖進去)。
3. 進 repo 的 **Settings → Pages**,Source 選 `main` 分支、`/ (root)`,存檔。
4. 等一兩分鐘,網址會是 `https://你的帳號.github.io/quiz-site/`。

## 接上 Google AdSense(有內容、有流量後再做)

1. 先把網站做得有幾個測驗、內容完整,再去 https://adsense.google.com 申請。
2. 申請時填你的 GitHub Pages 網址,Google 會給你一段 `ca-pub-XXXX` 的程式碼。
3. 打開 `index.html` 和 `quiz.html`,把最上面被 `<!-- -->` 註解掉的 AdSense `<script>` 取消註解,把 `ca-pub-XXXXXXXXXXXXXXXX` 換成你的。
4. 通過審核後,在 `.ad-slot` 的位置放上 Google 給的廣告單元程式碼。

## 上線前記得改

- `about.html` / `privacy.html` 裡的 `你的信箱@example.com` → 換成你真正的 Email。
- AdSense 審核**一定**要有可運作的隱私權政策頁,本站已備好。
