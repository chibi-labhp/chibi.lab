/* ============================================================
   このページの仕組み（メモ）
   ------------------------------------------------------------
   1. GitHub Contents API で script.js の中身を取得
   2. SITE / TOPICS / EVENTS / GALLERY の部分だけをテキストとして書き換え
   3. 同じ API で script.js を上書き保存（コミット）
   4. 数十秒〜数分で GitHub Pages に反映される
   ============================================================ */

const SITE_FIELDS = [
  "heroOrg", "heroKana", "heroTagline", "heroLead",
  "aboutBody1", "aboutBody2", "aboutPoint1", "aboutPoint2", "aboutPoint3",
  "contactBody", "contactEmail", "contactFormUrl",
  "snsX", "snsInstagram", "snsYoutube",
];

const ORDER_LABELS = {
  about: "ABOUT（わたしたちについて）",
  topics: "TOPICS（お知らせ）",
  schedule: "SCHEDULE（活動予定）",
  events: "EVENTS（活動記録）",
  gallery: "GALLERY（活動フォト）",
};
const ALL_ORDER_KEYS = Object.keys(ORDER_LABELS);

const state = { repo: "", token: "", sha: "", site: {}, topics: [], schedule: [], events: [], gallery: [], sections: [], sectionOrder: ["about", "topics", "schedule", "events", "gallery"], nextSectionKey: 1 };

const el = id => document.getElementById(id);

// 追加セクション（STEP7）はナビ用のid（navLabelから作る。同名だと衝突しうる）
// とは別に、削除・リネームしても揺らがない管理用の内部キー（"section:数字"）を
// state.sectionOrder側の目印として使う。保存・プレビュー時にだけ本物のidへ
// 変換する（サイト側が実際に参照できるのはそのidだけなので）。
function sectionOrderKey(sec) { return "section:" + sec._key; }

// script.jsから読み込んだSECTION_ORDER（固定ブロックのキーと、追加セクションの
// 本物のid文字列が混ざったもの。もしくは今日までの旧バージョンが保存した
// "custom"という1本のまとめキー）を、admin.js内部で使う"section:数字"形式の
// キーに変換する。あわせて、SECTION_ORDERに一度も出てこない追加セクションが
// あれば末尾に足しておく（保存時に何らかの理由で漏れていた場合の保険）。
function migrateSectionOrder(rawOrder) {
  const order = [];
  rawOrder.forEach(key => {
    if (key === "custom") {
      // 旧バージョン（追加セクションをまとめて1本で扱っていた）からの移行：
      // その位置に、まだ登場していない追加セクションを配列の順番で展開する
      state.sections.forEach(s => {
        const k = sectionOrderKey(s);
        if (!order.includes(k)) order.push(k);
      });
      return;
    }
    const match = state.sections.find(s => s.id === key);
    if (match) {
      const k = sectionOrderKey(match);
      if (!order.includes(k)) order.push(k);
      return;
    }
    if (!order.includes(key)) order.push(key);
  });
  state.sections.forEach(s => {
    const k = sectionOrderKey(s);
    if (!order.includes(k)) order.push(k);
  });
  return order;
}

// 保存・プレビュー用に、"section:数字"キーを今の内容から計算した本物のid文字列
// へ変換したSECTION_ORDERを作る（サイト側はこのidでしか要素を探せないため）
function serializableSectionOrder() {
  const ids = sectionsWithComputedIds();
  return state.sectionOrder
    .map(key => {
      if (!key.startsWith("section:")) return key;
      const secKey = Number(key.slice(8));
      const idx = state.sections.findIndex(s => s._key === secKey);
      return idx !== -1 ? ids[idx].id : null;
    })
    .filter(Boolean);
}

// 前回入力したリポジトリ名だけ覚えておく（トークンは安全のため保存しない）
const REMEMBERED_REPO_KEY = "chibilab-admin-repo";
try {
  const rememberedRepo = localStorage.getItem(REMEMBERED_REPO_KEY);
  if (rememberedRepo) el("repoInput").value = rememberedRepo;
} catch (e) { /* localStorageが使えない環境では何もしない */ }

el("connectBtn").addEventListener("click", loadFromGitHub);
// 「＋追加」は一覧の上にあり、新しいカードは一覧の先頭に入る。追加直後は
// そのカードの最初の入力欄にカーソルを置き、少しの間色を付けて目印にする
function focusNewCard(card) {
  if (!card) return;
  card.classList.add("just-added");
  setTimeout(() => card.classList.remove("just-added"), 1700);
  const first = card.querySelector("input:not([type=file]):not([disabled]), textarea");
  if (first) first.focus({ preventScroll: true });
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}
function addToTop(list, blank, rerender, listId) {
  pushHistory();
  list.unshift(blank());
  rerender();
  focusNewCard(el(listId).querySelector("[data-idx]"));
}

el("addTopicBtn").addEventListener("click", () => addToTop(state.topics, blankTopic, renderTopics, "topicsList"));
el("addScheduleBtn").addEventListener("click", () => addToTop(state.schedule, blankSchedule, renderSchedule, "scheduleList"));
el("addEventBtn").addEventListener("click", () => addToTop(state.events, blankEvent, renderEvents, "eventsList"));
el("addPhotoBtn").addEventListener("click", () => addToTop(state.gallery, blankPhoto, renderGallery, "galleryList"));
el("addSectionBtn").addEventListener("click", () => {
  pushHistory();
  const sec = blankSection();
  sec._key = state.nextSectionKey++;
  state.sections.push(sec);
  state.sectionOrder.push(sectionOrderKey(sec));
  renderSections();
  renderOrder();
});
el("saveBtn").addEventListener("click", saveToGitHub);
el("previewBtn").addEventListener("click", showPreview);
el("closePreviewBtn").addEventListener("click", closePreview);
el("undoBtn").addEventListener("click", undo);
el("restoreBtn").addEventListener("click", restoreOriginal);

/* ============================================================
   元に戻す／読み込み時点に復元の仕組み
   ------------------------------------------------------------
   ・pushHistory() を操作の直前に呼ぶと、その時点の状態が履歴に積まれる
   ・「元に戻す」は履歴を1つ戻す。押した回数ぶん、何段階でも戻れる
   ・「読み込み時点に復元」は、GitHubから読み込んだ直後の状態に一気に戻す
   ============================================================ */

let historyStack = [];
let originalSnapshot = null;
let hasUnsavedChanges = false;
const MAX_HISTORY = 50;

function snapshotState() {
  return JSON.stringify({
    site: state.site,
    topics: state.topics,
    schedule: state.schedule,
    events: state.events,
    gallery: state.gallery,
    sections: state.sections,
    sectionOrder: state.sectionOrder,
  });
}

function pushHistory() {
  historyStack.push(snapshotState());
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  hasUnsavedChanges = true;
  updateHistoryButtons();
}

// タブを閉じる・別ページに移動する前に、保存し忘れた変更があれば警告する
window.addEventListener("beforeunload", e => {
  if (!hasUnsavedChanges) return;
  e.preventDefault();
  e.returnValue = "";
});

// Cmd/Ctrl+Sでも「保存してサイトに反映」を実行できるようにする
window.addEventListener("keydown", e => {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "s") return;
  if (el("saveBar").style.display === "none") return;
  e.preventDefault();
  if (!el("saveBtn").disabled) saveToGitHub();
});

/* ============================================================
   下書きの自動保存
   ------------------------------------------------------------
   保存し忘れたままタブを閉じたりブラウザが落ちたりしても、編集内容を
   ブラウザのlocalStorageに数秒おきに書き残しておき、次に同じリポジトリを
   読み込んだときに「復元しますか？」と聞けるようにする。トークンなどの
   認証情報は一切保存しない（保存されるのはSITE/TOPICS/EVENTS/GALLERY/
   SECTIONS/SECTION_ORDERの中身だけ）。
   ============================================================ */
const DRAFT_KEY = "chibilab-admin-draft";
let lastDraftSnapshot = null;

function saveDraft() {
  if (!state.repo) return;
  const snap = snapshotState();
  if (snap === lastDraftSnapshot) return;
  lastDraftSnapshot = snap;
  try {
    // baseSha: この下書きが「どの時点のscript.js」を元に編集されたものか
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ repo: state.repo, baseSha: state.sha, savedAt: Date.now(), snapshot: snap }));
  } catch (e) { /* 容量オーバー等で保存できなくても致命的ではないので無視する */ }
}

function clearDraft() {
  lastDraftSnapshot = null;
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* noop */ }
}

setInterval(saveDraft, 4000);

// 今読み込んだリポジトリに対応する下書きが残っていれば、復元するか確認する
function maybeRestoreDraft() {
  let raw;
  try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
  if (!raw) return;

  let draft;
  try { draft = JSON.parse(raw); } catch (e) { return; }
  if (!draft || draft.repo !== state.repo || !draft.snapshot) return;
  if (draft.snapshot === snapshotState()) return; // 今読み込んだ内容と同じなら何もしない

  // 下書きを取ったあとにGitHub側のscript.jsが（別の人の保存などで）変わっていたら、
  // その下書きは古い内容をもとにしているので復元しない。復元すると、その後に
  // 追加された写真やお知らせを古い状態で上書きして消してしまうため
  if (!draft.baseSha || draft.baseSha !== state.sha) {
    clearDraft();
    alert("前回保存しなかった編集内容がありましたが、そのあとサイトの内容が更新されているため破棄しました。\n（復元すると、新しく追加された内容が消えてしまうためです）");
    return;
  }

  const when = draft.savedAt ? new Date(draft.savedAt).toLocaleString("ja-JP") : "";
  const ok = confirm(
    `保存し忘れた編集内容が残っています${when ? `（${when}時点）` : ""}。復元しますか？\n` +
    "「キャンセル」を押すと、今読み込んだ内容のまま進みます。"
  );
  if (!ok) { clearDraft(); return; }

  pushHistory();
  const snap = JSON.parse(draft.snapshot);
  Object.assign(state, snap);
  state.nextSectionKey = state.sections.reduce((max, s) => Math.max(max, s._key || 0), 0) + 1;
}

// テキスト入力は1文字ごとに履歴を積まない。編集が始まった瞬間（＝直前の
// 状態）だけを記録し、同じ欄を続けて入力している間は積み直さない。
let textEditEl = null;
let textEditTimer = null;
function pushHistoryForTextEdit(e) {
  if (textEditEl !== e.target || !textEditTimer) {
    pushHistory();
  }
  textEditEl = e.target;
  clearTimeout(textEditTimer);
  textEditTimer = setTimeout(() => { textEditTimer = null; textEditEl = null; }, 1000);
}

function undo() {
  if (!historyStack.length) return;
  const snap = JSON.parse(historyStack.pop());
  Object.assign(state, snap);
  renderAll();
  updateHistoryButtons();
}

function restoreOriginal() {
  if (!originalSnapshot) return;
  if (!confirm("読み込んだ時点の状態に戻します。保存していない変更は失われますがよろしいですか？")) return;
  const snap = JSON.parse(originalSnapshot);
  Object.assign(state, snap);
  historyStack = [];
  hasUnsavedChanges = false;
  clearDraft();
  renderAll();
  updateHistoryButtons();
}

function updateHistoryButtons() {
  el("undoBtn").disabled = historyStack.length === 0;
}

function renderAll() {
  renderSite();
  renderOrder();
  renderTopics();
  renderSchedule();
  renderEvents();
  renderGallery();
  renderSections();
}

function renderOrder() {
  el("orderList").innerHTML = state.sectionOrder.map((key, i) => {
    if (key.startsWith("section:")) {
      const secKey = Number(key.slice(8));
      const sec = state.sections.find(s => s._key === secKey);
      if (!sec) return ""; // 削除済みなど、参照が古くなっている場合の保険
      const label = sec.navLabel ? escapeHtml(sec.navLabel) : "（名称未設定の追加セクション）";
      return `
        <div class="event-card" data-idx="${i}">
          <span class="drag-handle" title="ドラッグで並び替え">⠿⠿</span>
          <strong>${label}</strong>
          <button class="remove-btn" data-remove-order-section="${key}" style="position:static; margin-left:auto; display:block;">削除</button>
        </div>
      `;
    }
    const label = ORDER_LABELS[key] || key;
    return `
      <div class="event-card" data-idx="${i}">
        <span class="drag-handle" title="ドラッグで並び替え">⠿⠿</span>
        <strong>${label}</strong>
        <button class="remove-btn" data-hide-section="${key}" style="position:static; margin-left:auto; display:block;">非表示にする</button>
      </div>
    `;
  }).join("");

  const hidden = ALL_ORDER_KEYS.filter(key => !state.sectionOrder.includes(key));
  el("hiddenOrderList").innerHTML = hidden.length ? `
    <p class="setup-note" style="margin-bottom:8px;">非表示中：</p>
    <div style="display:flex; flex-wrap:wrap; gap:8px;">
      ${hidden.map(key => `
        <button class="add-btn" data-show-section="${key}" style="width:auto; margin:0; padding:8px 14px;">
          ＋ ${ORDER_LABELS[key] || key}を表示する
        </button>
      `).join("")}
    </div>
  ` : "";
}

el("hiddenOrderList").addEventListener("click", e => {
  const key = e.target.dataset.showSection;
  if (key === undefined) return;
  pushHistory();
  state.sectionOrder.push(key);
  renderOrder();
});

/* ============================================================
   ドラッグ並び替え（Pointer Events版）
   ------------------------------------------------------------
   HTML5標準のドラッグ&ドロップAPIはスマホ・タブレットのタッチ操作では
   動かないブラウザが多いため、マウスもタッチも同じ仕組みで扱える
   Pointer Events（pointerdown/pointermove/pointerup）で自作している。
   カードの入力欄・ボタン・リンク以外なら、どこを掴んでもドラッグを
   始められる（excludeSelectorを指定すると、その中は別の並び替え対象
   ―セクション内の項目など―に譲る）。
   ドラッグ中、指やカーソルが別のカードの上を通過するたびに、その場で
   配列を入れ替えて再描画する（Trelloのカード並び替えと同じ方式）。
   移動が起きた瞬間は、直前の位置からふわっとスライドするアニメーションを
   つけている（FLIP法：再描画の前後で位置の差分を測り、逆向きに一瞬ずらして
   から本来の位置へtransitionさせる）。
   ============================================================ */
const NON_DRAGGABLE_SELECTOR = "input, textarea, select, button, a";

// cardSelector（例: "[data-idx]"）は、カード自身だけでなく、カード内の
// 各入力欄（日付・タイトル・本文…）にも同じdata-idx属性が付いているため、
// 素朴に closest()/querySelectorAll() すると入力欄までヒットしてしまい、
// ドラッグ中のアニメーションやハイライトが違う要素に適用されてしまう
// （特に入力欄の多いTOPICSで顕著）。「他のマッチの中に入れ子になっていない、
// 一番外側のカード」だけに絞り込むためのヘルパー
function closestChildCard(startEl, container, cardSelector) {
  let node = startEl.closest(cardSelector);
  if (!node || !container.contains(node)) return null;
  for (;;) {
    const parent = node.parentElement;
    if (!parent || parent === container || !container.contains(parent)) return node;
    const outer = parent.closest(cardSelector);
    if (!outer || !container.contains(outer)) return node;
    node = outer;
  }
}

// container内でcardSelectorに一致する要素のうち、入れ子になっていない
// 最も外側のものだけを返す（querySelectorAllの入力欄誤ヒット対策）
function topLevelCards(container, cardSelector) {
  const all = Array.from(container.querySelectorAll(cardSelector));
  const set = new Set(all);
  return all.filter(elm => {
    let p = elm.parentElement;
    while (p && p !== container) {
      if (set.has(p)) return false;
      p = p.parentElement;
    }
    return true;
  });
}

function makeSortable(container, cardSelector, getLocation, rerender, excludeSelector) {
  container.addEventListener("pointerdown", e => {
    if (e.target.closest(NON_DRAGGABLE_SELECTOR)) return;
    if (excludeSelector && e.target.closest(excludeSelector)) return;
    const card = closestChildCard(e.target, container, cardSelector);
    if (!card || !container.contains(card)) return;

    e.preventDefault();
    pushHistory();

    const startLoc = getLocation(card);
    const draggedItem = startLoc.list[startLoc.index];
    let moved = false;

    card.classList.add("card-dragging");

    function onMove(ev) {
      const elAtPoint = document.elementFromPoint(ev.clientX, ev.clientY);
      const overCard = elAtPoint && closestChildCard(elAtPoint, container, cardSelector);
      if (!overCard || !container.contains(overCard)) return;

      const overLoc = getLocation(overCard);
      // 別のセクションの項目や、別リストへは移動できないようにする
      if (overLoc.list !== startLoc.list) return;

      const curList = overLoc.list;
      const curIndex = curList.indexOf(draggedItem);
      if (curIndex === -1) return;
      if (overLoc.index === curIndex) return;

      const finishAnimation = prepareSlideAnimation(container, cardSelector, curIndex, overLoc.index);
      curList.splice(curIndex, 1);
      curList.splice(overLoc.index, 0, draggedItem);
      moved = true;
      rerender();
      finishAnimation();

      const newCards = topLevelCards(container, cardSelector);
      if (newCards[overLoc.index]) newCards[overLoc.index].classList.add("card-dragging");
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      container.querySelectorAll(".card-dragging").forEach(c => c.classList.remove("card-dragging"));
      if (!moved) {
        // 何も動かなかった場合は、直前に積んだ履歴を取り消しておく
        historyStack.pop();
        updateHistoryButtons();
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });
}

// 入れ替え前の各カードの位置を記録しておき、再描画後にそのカードが
// 実際どれだけ動いたかを計算して、逆方向にずらした状態から元の位置へ
// スッと戻すことで「動いた」ことが視覚的にわかるようにする
function prepareSlideAnimation(container, cardSelector, fromIndex, toIndex) {
  const oldRects = topLevelCards(container, cardSelector).map(c => c.getBoundingClientRect());

  return () => {
    const newCards = topLevelCards(container, cardSelector);
    newCards.forEach((card, newIndex) => {
      let oldIndex;
      if (newIndex === toIndex) {
        oldIndex = fromIndex;
      } else if (fromIndex < toIndex && newIndex >= fromIndex && newIndex < toIndex) {
        oldIndex = newIndex + 1;
      } else if (fromIndex > toIndex && newIndex > toIndex && newIndex <= fromIndex) {
        oldIndex = newIndex - 1;
      } else {
        oldIndex = newIndex;
      }

      const oldRect = oldRects[oldIndex];
      if (!oldRect) return;
      const newRect = card.getBoundingClientRect();
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dy) < 1) return;

      card.style.transition = "none";
      card.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => {
        card.style.transition = "transform 180ms ease";
        card.style.transform = "";
      });
    });
  };
}

// カード一覧の削除・入力を、毎回の再描画で再登録しなくて済むよう、
// リストの外枠（container）にイベント委任でまとめて設定する
// newestFirst を true/false で渡すと「日付順に自動で並ぶ一覧」になる。
// ドラッグ並び替えはせず、日付欄の入力が終わった（欄から離れた）時点で並べ直す
function setupListEditor(container, getArray, rerender, newestFirst) {
  const dateSorted = newestFirst !== undefined;
  container.addEventListener("input", e => {
    const idx = e.target.dataset.idx;
    if (idx === undefined) return;
    pushHistoryForTextEdit(e);
    getArray()[idx][e.target.dataset.field] = e.target.value;
    if (e.target.dataset.field === "image") updateImageThumb(e.target);
  });

  container.addEventListener("click", e => {
    const removeIdx = e.target.dataset.remove;
    if (removeIdx === undefined) return;
    pushHistory();
    getArray().splice(removeIdx, 1);
    rerender();
  });

  if (dateSorted) {
    container.addEventListener("change", e => {
      const part = e.target.dataset.datePart;
      if (!part) return;
      const field = e.target.closest(".date-field");
      const start = field.querySelector('[data-date-part="start"]').value;
      const endInput = field.querySelector('[data-date-part="end"]');
      pushHistory();
      const arr = getArray();
      const item = arr[e.target.dataset.dateIdx];
      item.date = composeDateText(start, endInput ? endInput.value : "");
      arr.splice(0, arr.length, ...sortByDate(arr, newestFirst));
      rerender();

      // 並び直してカードが移動したら、画面をそのカードまで追いかけて目印を付け、
      // 次の入力欄（タイトル・キャプションなど）にカーソルを置く
      const newIdx = arr.indexOf(item);
      const card = container.querySelector(`[data-idx="${newIdx}"]:not(input):not(textarea)`);
      if (!card) return;
      if (newIdx !== Number(e.target.dataset.dateIdx)) {
        card.classList.add("just-added");
        setTimeout(() => card.classList.remove("just-added"), 1700);
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // 開始日を選んだら終了日へ（終了日の欄がない一覧では次の入力欄へ）、
      // 終了日を選んだら次の入力欄へ
      const endField = card.querySelector('[data-date-part="end"]');
      const next = card.querySelector('input[type=text][data-field]');
      const target = part === "start" && endField && !endField.disabled ? endField : next;
      if (target) target.focus({ preventScroll: true });
    });
    return;
  }

  makeSortable(container, "[data-idx]", card => ({
    list: getArray(),
    index: Number(card.dataset.idx),
  }), rerender);
}

/* ============================================================
   日付の入力（カレンダーから選ぶ）
   ------------------------------------------------------------
   手入力だと「2026/11/3」「11月3日」など書き方がぶれて、並び順や
   「過ぎた予定を隠す」判定が崩れるため、日付は<input type="date">の
   カレンダーで選ぶ。保存する形式はこれまでどおりの文字列
   （"2026.11.03" / 期間なら "2026.11.22–23" など）なので、サイト側や
   過去のデータはそのまま使える。
   ============================================================ */
const pad2 = n => String(n).padStart(2, "0");

// 保存されている日付文字列 → カレンダー用の { start, end }（"YYYY-MM-DD"、無ければ ""）
function parseDateText(text) {
  const m = String(text || "").match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})(?:\s*[–—~〜-]\s*(?:(\d{4})[.\/-])?(?:(\d{1,2})[.\/-])?(\d{1,2}))?/);
  if (!m) return { start: "", end: "" };
  const start = `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
  const end = m[6] ? `${m[4] || m[1]}-${pad2(m[5] || m[2])}-${pad2(m[6])}` : "";
  return { start, end };
}

// カレンダーで選んだ開始日・終了日 → 保存用の日付文字列
function composeDateText(start, end) {
  if (!start) return "";
  const [sy, sm, sd] = start.split("-");
  const head = `${sy}.${sm}.${sd}`;
  if (!end || end <= start) return head;
  const [ey, em, ed] = end.split("-");
  if (ey !== sy) return `${head}–${ey}.${em}.${ed}`;
  if (em !== sm) return `${head}–${em}.${ed}`;
  return `${head}–${ed}`;
}

// 日付欄のHTML。allowRange が true なら「終了日（任意）」も出す
function dateFieldHtml(i, dateText, allowRange, hint) {
  const { start, end } = parseDateText(dateText);
  // カレンダーで読み取れない古い書き方が残っていたら、元の表記を見せておく
  const legacy = dateText && !start ? `<p class="setup-note" style="margin:6px 0 0;">元の表記：「${escapeHtml(dateText)}」（カレンダーで選び直すと置き換わります）</p>` : "";
  return `
    <div class="date-field">
      <div class="${allowRange ? "row2" : ""}">
        <div>
          <label>${allowRange ? "日付（開始日）" : "日付"}</label>
          <input type="date" data-date-part="start" data-date-idx="${i}" value="${start}">
        </div>
        ${allowRange ? `
        <div>
          <label>終了日（複数日のときだけ）</label>
          <input type="date" data-date-part="end" data-date-idx="${i}" value="${end}" min="${start}" ${start ? "" : "disabled"}>
        </div>` : ""}
      </div>
      ${hint ? `<p class="setup-note" style="margin:6px 0 0;">${hint}</p>` : ""}
      ${legacy}
    </div>
  `;
}

// サイト側（script.js）と同じ並べ方。日付欄の書き出しを数値にして比べ、
// 読み取れないもの（"日程調整中" など）は常に一番上、同じ日付は元の順を保つ
function dateStartValue(dateText) {
  const m = String(dateText || "").match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/);
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}
function sortByDate(list, newestFirst) {
  return list
    .map((item, i) => ({ item, i, v: dateStartValue(item.date) }))
    .sort((a, b) => {
      if (a.v === null || b.v === null) {
        if (a.v === b.v) return a.i - b.i;
        return a.v === null ? -1 : 1;
      }
      if (a.v !== b.v) return newestFirst ? b.v - a.v : a.v - b.v;
      return a.i - b.i;
    })
    .map(x => x.item);
}

SITE_FIELDS.forEach(key => {
  el("site-" + key).addEventListener("input", e => {
    pushHistoryForTextEdit(e);
    state.site[key] = e.target.value;
  });
});

setupListEditor(el("topicsList"), () => state.topics, renderTopics, true);
setupListEditor(el("scheduleList"), () => state.schedule, renderSchedule, false);
setupListEditor(el("eventsList"), () => state.events, renderEvents, true);
setupListEditor(el("galleryList"), () => state.gallery, renderGallery, true);
setupSectionsEditor();

wireImageUpload(el("topicsList"), (target, path) => { state.topics[target.dataset.uploadIdx].image = path; }, renderTopics);
wireImageUpload(el("galleryList"), (target, path) => { state.gallery[target.dataset.uploadIdx].image = path; }, renderGallery);
wireImageUpload(el("sectionsList"), (target, path) => {
  const [si, ii] = target.dataset.uploadIt.split(":");
  state.sections[si].items[ii].image = path;
}, renderSections);

makeSortable(el("orderList"), "[data-idx]", card => ({
  list: state.sectionOrder,
  index: Number(card.dataset.idx),
}), renderOrder);

el("orderList").addEventListener("click", e => {
  if (e.target.dataset.hideSection !== undefined) {
    const key = e.target.dataset.hideSection;
    pushHistory();
    state.sectionOrder.splice(state.sectionOrder.indexOf(key), 1);
    renderOrder();
    return;
  }
  if (e.target.dataset.removeOrderSection !== undefined) {
    const key = e.target.dataset.removeOrderSection;
    const secKey = Number(key.slice(8));
    pushHistory();
    const idx = state.sections.findIndex(s => s._key === secKey);
    if (idx !== -1) state.sections.splice(idx, 1);
    const orderIdx = state.sectionOrder.indexOf(key);
    if (orderIdx !== -1) state.sectionOrder.splice(orderIdx, 1);
    renderOrder();
    renderSections();
  }
});

function blankTopic() {
  return { date: "", title: "", body: "", image: "" };
}
function blankSchedule() {
  return { date: "", time: "", title: "", place: "", body: "", link: "" };
}
function blankEvent() {
  return { date: "", title: "", place: "", body: "" };
}
function blankPhoto() {
  return { date: "", image: "", color: "#AB511F", caption: "", tilt: 0 };
}
function blankSection() {
  return { navLabel: "", title: "", intro: "", bg: "cream", items: [] };
}
function blankSectionItem() {
  return { title: "", body: "", image: "", link: "" };
}

async function loadFromGitHub() {
  const repo = el("repoInput").value.trim();
  const token = el("tokenInput").value.trim();
  const status = el("connectStatus");

  if (!repo || !token) {
    status.textContent = "リポジトリとトークンを入力してください";
    status.className = "status err";
    return;
  }

  status.textContent = "読み込み中…";
  status.className = "status busy";

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/script.js`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) throw new Error(`GitHubに接続できませんでした（${res.status}）`);
    const data = await res.json();
    const content = decodeURIComponent(escape(atob(data.content)));

    try { localStorage.setItem(REMEMBERED_REPO_KEY, repo); } catch (e) { /* 保存できなくても致命的ではない */ }

    state.repo = repo;
    state.token = token;
    state.sha = data.sha;
    state.site = extractObject(content, "SITE");
    state.topics = extractArray(content, "TOPICS");
    state.topics = sortByDate(state.topics, true);
    state.schedule = sortByDate(extractArray(content, "UPCOMING"), false);
    state.events = sortByDate(extractArray(content, "EVENTS"), true);
    state.gallery = sortByDate(extractArray(content, "GALLERY"), true);
    state.sections = extractArray(content, "SECTIONS");
    state.sections.forEach((s, i) => { s._key = i + 1; });
    state.nextSectionKey = state.sections.length + 1;

    let rawOrder = extractArray(content, "SECTION_ORDER");
    if (!rawOrder.length) rawOrder = ["about", "topics", "schedule", "events", "gallery"];
    state.sectionOrder = migrateSectionOrder(rawOrder);
    state.rawContent = content;

    historyStack = [];
    originalSnapshot = snapshotState();
    hasUnsavedChanges = false;
    updateHistoryButtons();
    maybeRestoreDraft();

    renderAll();
    el("sitePanel").style.display = "block";
    el("orderPanel").style.display = "block";
    el("topicsPanel").style.display = "block";
    el("schedulePanel").style.display = "block";
    el("eventsPanel").style.display = "block";
    el("galleryPanel").style.display = "block";
    el("sectionsPanel").style.display = "block";
    el("saveBar").style.display = "flex";

    status.textContent = "読み込み完了 ✓";
    status.className = "status ok";
  } catch (e) {
    status.textContent = "エラー: " + e.message;
    status.className = "status err";
  }
}

// script.js のテキストから TOPICS / EVENTS / GALLERY 配列を抜き出してJSオブジェクトに変換
function extractArray(content, varName) {
  const re = new RegExp(`(?:const|var|let) ${varName} = (\\[[\\s\\S]*?\\]);`);
  const match = content.match(re);
  if (!match) return [];
  // eslint-disable-next-line no-eval
  return (0, eval)(match[1]);
}

// script.js のテキストから SITE オブジェクトを抜き出してJSオブジェクトに変換
function extractObject(content, varName) {
  const re = new RegExp(`(?:const|var|let) ${varName} = (\\{[\\s\\S]*?\\});`);
  const match = content.match(re);
  if (!match) return {};
  // eslint-disable-next-line no-eval
  return (0, eval)("(" + match[1] + ")");
}

function renderSite() {
  SITE_FIELDS.forEach(key => {
    el("site-" + key).value = state.site[key] || "";
  });
}

function renderTopics() {
  el("topicsList").innerHTML = state.topics.map((t, i) => `
    <div class="event-card" data-idx="${i}" style="touch-action:auto;">
      <button class="remove-btn" data-remove="${i}">削除</button>
      ${dateFieldHtml(i, t.date, false, "")}
      <label>タイトル</label>
      <input type="text" data-idx="${i}" data-field="title" value="${escapeAttr(t.title)}" placeholder="お知らせのタイトル">
      <label>本文</label>
      <textarea data-idx="${i}" data-field="body" placeholder="お知らせの内容">${escapeHtml(t.body)}</textarea>
      <label>画像ファイル名（任意。images/フォルダに入れたファイル名）</label>
      <input type="text" data-idx="${i}" data-field="image" value="${escapeAttr(t.image)}" placeholder="images/topic01.jpg">
      ${imageUploadWidgetHtml(`data-upload-idx="${i}"`, t.image)}
    </div>
  `).join("");
}

function renderSchedule() {
  el("scheduleList").innerHTML = state.schedule.map((ev, i) => `
    <div class="event-card" data-idx="${i}" style="touch-action:auto;">
      <button class="remove-btn" data-remove="${i}">削除</button>
      ${dateFieldHtml(i, ev.date, true, "空欄のままなら「日程未定」と表示されます")}
      <div class="row2">
        <div>
          <label>時間（任意）</label>
          <input type="text" data-idx="${i}" data-field="time" value="${escapeAttr(ev.time)}" placeholder="10:00〜16:00">
        </div>
        <div>
          <label>場所（任意）</label>
          <input type="text" data-idx="${i}" data-field="place" value="${escapeAttr(ev.place)}" placeholder="東芝未来科学館">
        </div>
      </div>
      <label>タイトル</label>
      <input type="text" data-idx="${i}" data-field="title" value="${escapeAttr(ev.title)}" placeholder="イベント名">
      <label>説明文（任意）</label>
      <textarea data-idx="${i}" data-field="body" placeholder="対象・内容・参加方法など">${escapeHtml(ev.body)}</textarea>
      <label>詳細・申込ページのURL（任意）</label>
      <input type="text" data-idx="${i}" data-field="link" value="${escapeAttr(ev.link)}" placeholder="https://...">
    </div>
  `).join("");
}

function renderEvents() {
  el("eventsList").innerHTML = state.events.map((ev, i) => `
    <div class="event-card" data-idx="${i}" style="touch-action:auto;">
      <button class="remove-btn" data-remove="${i}">削除</button>
      ${dateFieldHtml(i, ev.date, true, "")}
      <label>場所</label>
      <input type="text" data-idx="${i}" data-field="place" value="${escapeAttr(ev.place)}" placeholder="としま産業振興プラザ">
      <label>タイトル</label>
      <input type="text" data-idx="${i}" data-field="title" value="${escapeAttr(ev.title)}" placeholder="イベント名">
      <label>説明文</label>
      <textarea data-idx="${i}" data-field="body" placeholder="どんな内容だったか、簡単に">${escapeHtml(ev.body)}</textarea>
    </div>
  `).join("");
}

function renderGallery() {
  el("galleryList").innerHTML = state.gallery.map((g, i) => `
    <div class="gallery-card" data-idx="${i}" style="touch-action:auto;">
      <button class="remove-btn" data-remove="${i}">削除</button>
      ${dateFieldHtml(i, g.date, false, "撮影日（イベントの日）。サイトには表示されず、新しい写真を上に並べるためだけに使います")}
      <label>キャプション</label>
      <input type="text" data-idx="${i}" data-field="caption" value="${escapeAttr(g.caption)}" placeholder="サイエンスショーの様子">
      <label>画像ファイル名（images/フォルダに入れたファイル名。空欄なら色プレースホルダー）</label>
      <input type="text" data-idx="${i}" data-field="image" value="${escapeAttr(g.image)}" placeholder="images/event01.jpg">
      ${imageUploadWidgetHtml(`data-upload-idx="${i}"`, g.image)}
    </div>
  `).join("");
}

function renderSections() {
  el("sectionsList").innerHTML = state.sections.map((s, si) => `
    <div class="section-card" data-section-idx="${si}">
      <button class="remove-btn" data-remove-section="${si}">セクションごと削除</button>
      <label>ナビゲーションの表示名（英字推奨。例: CRAFT）</label>
      <input type="text" data-sec="${si}" data-field="navLabel" value="${escapeAttr(s.navLabel)}" placeholder="CRAFT">
      <label>見出し</label>
      <input type="text" data-sec="${si}" data-field="title" value="${escapeAttr(s.title)}" placeholder="工作紹介">
      <label>説明文（任意）</label>
      <textarea data-sec="${si}" data-field="intro" placeholder="このセクションの紹介文">${escapeHtml(s.intro)}</textarea>
      <label>背景色</label>
      <div class="bg-choice">
        ${[["cream", "クリーム色", "#FFFBEA"], ["yellow", "黄色", "#FFF6C4"]].map(([val, name, color]) => `
          <label class="bg-option">
            <input type="radio" name="bg-${s._key}" data-sec="${si}" data-field="bg" value="${val}" ${sectionBg(s, si) === val ? "checked" : ""}>
            <span class="bg-swatch" style="background:${color};"></span>${name}
          </label>
        `).join("")}
      </div>

      <label style="margin-top:16px;">このセクションの項目</label>
      <button class="add-btn" data-add-item="${si}">＋ 項目を追加</button>
      <div class="items-editor">
        ${s.items.map((it, ii) => `
          <div class="event-card" data-item-idx="${ii}" data-section-idx-for-item="${si}">
            <span class="drag-handle item-drag-handle" title="ドラッグで項目を並び替え">⠿⠿</span>
            <button class="remove-btn" data-remove-item="${si}:${ii}">削除</button>
            <label>タイトル</label>
            <input type="text" data-it="${si}:${ii}" data-field="title" value="${escapeAttr(it.title)}" placeholder="項目タイトル">
            <label>説明</label>
            <textarea data-it="${si}:${ii}" data-field="body" placeholder="説明文">${escapeHtml(it.body)}</textarea>
            <label>画像ファイル名（任意）</label>
            <input type="text" data-it="${si}:${ii}" data-field="image" value="${escapeAttr(it.image)}" placeholder="images/xxx.jpg">
            ${imageUploadWidgetHtml(`data-upload-it="${si}:${ii}"`, it.image)}
            <label>リンクURL（任意）</label>
            <input type="text" data-it="${si}:${ii}" data-field="link" value="${escapeAttr(it.link)}" placeholder="https://...">
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

// サイト側の sectionIsYellow() と同じ決め方で、今の背景色を "cream"/"yellow" で返す
// （bg 未指定の古いデータは交互＝1つ目が黄色）
function sectionBg(s, i) {
  if (s.bg === "yellow" || s.bg === "cream") return s.bg;
  return i % 2 === 0 ? "yellow" : "cream";
}

function setupSectionsEditor() {
  const container = el("sectionsList");

  container.addEventListener("input", e => {
    if (e.target.dataset.sec !== undefined) {
      pushHistoryForTextEdit(e);
      state.sections[e.target.dataset.sec][e.target.dataset.field] = e.target.value;
      // STEP3のラベルはセクション名（navLabel）を表示しているので、
      // 入力中もそこに反映されるようにする
      if (e.target.dataset.field === "navLabel") renderOrder();
    } else if (e.target.dataset.it !== undefined) {
      pushHistoryForTextEdit(e);
      const [si, ii] = e.target.dataset.it.split(":");
      state.sections[si].items[ii][e.target.dataset.field] = e.target.value;
      if (e.target.dataset.field === "image") updateImageThumb(e.target);
    }
  });

  container.addEventListener("click", e => {
    if (e.target.dataset.removeSection !== undefined) {
      pushHistory();
      const removed = state.sections.splice(e.target.dataset.removeSection, 1)[0];
      const orderIdx = state.sectionOrder.indexOf(sectionOrderKey(removed));
      if (orderIdx !== -1) state.sectionOrder.splice(orderIdx, 1);
      renderSections();
      renderOrder();
    } else if (e.target.dataset.removeItem !== undefined) {
      pushHistory();
      const [si, ii] = e.target.dataset.removeItem.split(":");
      state.sections[si].items.splice(ii, 1);
      renderSections();
    } else if (e.target.dataset.addItem !== undefined) {
      pushHistory();
      const si = e.target.dataset.addItem;
      state.sections[si].items.unshift(blankSectionItem());
      renderSections();
      focusNewCard(container.querySelector(`[data-section-idx-for-item="${si}"][data-item-idx="0"]`));
    }
  });

  // セクションそのものをサイト上のどこに表示するかはSTEP3で決めるため、
  // ここではセクション自体の並び替えはしない（項目の並び替えのみ）。

  // セクション内の項目の並び替え（同じセクションの中でのみ動く）
  makeSortable(container, "[data-item-idx]", card => {
    const si = Number(card.dataset.sectionIdxForItem);
    return { list: state.sections[si].items, index: Number(card.dataset.itemIdx) };
  }, renderSections);
}

// ナビ表示名からURL用のIDを作る（例: "工作紹介" → "section-1"、"Craft Ideas" → "craft-ideas"）
function slugify(str, fallback) {
  const s = (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || fallback;
}

function escapeHtml(s) { return (s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
function escapeAttr(s) { return (s || "").replace(/"/g, "&quot;"); }

// "owner/repo" 形式のリポジトリ名から、GitHub Pagesの公開URLを組み立てる
function pagesUrlFromRepo(repo) {
  const [owner, name] = (repo || "").split("/");
  if (!owner || !name) return null;
  return `https://${owner}.github.io/${name}/`;
}

// 画像ファイル名を入力する欄の下に、サムネイル表示＋アップロードボタンを
// 添える。dataAttrsはテキスト欄と同じ data-idx/data-it + data-field を
// そのままサムネイル・ファイル選択にも付けておき、後でどの項目の画像かを
// 特定できるようにする
// uploadAttrsは data-upload-idx や data-upload-it など、ファイル選択時に
// state内のどの項目を更新すればよいかを識別するための属性。
// あえてテキスト欄と同じ data-idx/data-it を使わないのは、
// <input type="file"> も input/change イベントを発火するため、既存の
// テキスト同期用の委任リスナーに誤って拾われてしまうのを避けるため
function imageUploadWidgetHtml(uploadAttrs, value) {
  return `
    <div class="image-field-row">
      <img class="image-thumb" src="${value ? escapeAttr(value) : ""}" style="${value ? "" : "display:none;"}" onerror="this.style.display='none'">
      <label class="image-upload-btn">
        画像を選ぶ
        <input type="file" accept="image/*" class="image-upload-input" ${uploadAttrs} style="display:none;">
      </label>
      <span class="image-upload-status"></span>
    </div>
  `;
}

// 画像ファイル名の欄を手入力で書き換えたときも、隣のサムネイルをその場で
// 更新する（imageUploadWidgetHtmlがテキスト欄の直後に置かれている前提）
function updateImageThumb(inputEl) {
  const row = inputEl.nextElementSibling;
  if (!row || !row.classList.contains("image-field-row")) return;
  const thumb = row.querySelector(".image-thumb");
  if (!thumb) return;
  const value = inputEl.value.trim();
  thumb.style.display = value ? "" : "none";
  thumb.src = value;
}

// 選んだファイルをGitHubリポジトリのimages/フォルダへ直接アップロードし、
// 保存されたパス（例: images/1699999999-photo.jpg）を返す
async function uploadImageFile(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
  const path = `images/${Date.now()}-${safeName}`;

  const res = await fetch(`https://api.github.com/repos/${state.repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${state.token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: `admin: 画像を追加 (${path})`,
      content: base64,
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `アップロードに失敗しました（${res.status}）`);
  }
  return path;
}

// container内の「画像を選ぶ」ファイル入力の変更を拾い、アップロード完了後に
// setImagePath(target, path)でstateを更新してrerenderする
function wireImageUpload(container, setImagePath, rerender) {
  container.addEventListener("change", async e => {
    if (!e.target.classList.contains("image-upload-input")) return;
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = e.target.closest(".image-field-row").querySelector(".image-upload-status");
    statusEl.textContent = "アップロード中…";
    statusEl.className = "image-upload-status busy";

    try {
      const path = await uploadImageFile(file);
      pushHistory();
      setImagePath(e.target, path);
      rerender();
    } catch (err) {
      statusEl.textContent = "エラー: " + err.message;
      statusEl.className = "image-upload-status err";
    }
  });
}

// state.site/topics/schedule/events/gallery の今の内容を反映した script.js 全文を組み立てる
// （保存とプレビューの両方から使う）
function buildUpdatedScriptContent() {
  const newSiteBlock = "var SITE = " + JSON.stringify(state.site, null, 2) + ";";
  const newTopicsBlock = "var TOPICS = " + JSON.stringify(state.topics, null, 2) + ";";
  const newScheduleBlock = "var UPCOMING = " + JSON.stringify(state.schedule, null, 2) + ";";
  const newEventsBlock = "var EVENTS = " + JSON.stringify(state.events, null, 2) + ";";
  const newGalleryBlock = "var GALLERY = " + JSON.stringify(state.gallery, null, 2) + ";";
  const newSectionsBlock = "var SECTIONS = " + JSON.stringify(sectionsWithComputedIds(), null, 2) + ";";
  const newOrderBlock = "var SECTION_ORDER = " + JSON.stringify(serializableSectionOrder(), null, 2) + ";";

  // 活動予定（UPCOMING）がまだないscript.jsなら、EVENTSの直前に足す
  const upcomingRe = /(?:const|var|let) UPCOMING = \[[\s\S]*?\];/;
  const base = upcomingRe.test(state.rawContent)
    ? state.rawContent.replace(upcomingRe, () => newScheduleBlock)
    : state.rawContent.replace(/(?:const|var|let) EVENTS = /, m => newScheduleBlock + "\n\n" + m);

  return base
    .replace(/(?:const|var|let) SITE = \{[\s\S]*?\};/, newSiteBlock)
    .replace(/(?:const|var|let) TOPICS = \[[\s\S]*?\];/, newTopicsBlock)
    .replace(/(?:const|var|let) EVENTS = \[[\s\S]*?\];/, newEventsBlock)
    .replace(/(?:const|var|let) GALLERY = \[[\s\S]*?\];/, newGalleryBlock)
    .replace(/(?:const|var|let) SECTIONS = \[[\s\S]*?\];/, newSectionsBlock)
    .replace(/(?:const|var|let) SECTION_ORDER = \[[\s\S]*?\];/, newOrderBlock);
}

// 現在ドラフト中の内容(state)を反映したSECTIONS配列（id付き）を作る
function sectionsWithComputedIds() {
  return state.sections.map((s, i) => {
    // _keyはadmin.js内部だけで使う管理用の値なので、サイト側に渡すデータには含めない
    const { _key, ...rest } = s;
    return { ...rest, id: slugify(s.navLabel, "section-" + (i + 1)) };
  });
}

/* ============================================================
   保存前に、今の編集内容が実際のサイトでどう見えるかをiframeで表示する
   ------------------------------------------------------------
   以前は「index.htmlを取得してscript.jsの中身を文字列置換で埋め込む」
   方式だったが、キャッシュ・エスケープ処理の噛み合わせによっては
   更新前の内容が表示され続けることがあった。
   今は「実際にindex.htmlをキャッシュなしで本物のページとして読み込み、
   読み込み後にサイト側と全く同じ変数(SITE/TOPICS/...)・関数
   (renderSite()など)をその場で上書き・再実行する」方式にして、
   文字列操作の余地をなくしている。
   ============================================================ */
async function showPreview() {
  const status = el("saveStatus");
  const previewBtn = el("previewBtn");
  previewBtn.disabled = true;
  status.textContent = "プレビューを準備中…";
  status.className = "status busy";

  try {
    const frame = el("previewFrame");
    el("previewOverlay").style.display = "flex";

    // クエリ文字列を毎回変えることで、途中のキャッシュ層をすべて回避する
    await new Promise((resolve, reject) => {
      frame.onload = resolve;
      frame.onerror = () => reject(new Error("プレビューの読み込みに失敗しました"));
      frame.src = "index.html?preview=" + Date.now();
    });

    const win = frame.contentWindow;
    if (!win || typeof win.renderSite !== "function") {
      throw new Error("プレビューの内部処理が見つかりませんでした");
    }

    // サイト本体と同じグローバル変数を、今の編集内容で上書きする
    win.SITE = state.site;
    win.TOPICS = state.topics;
    win.UPCOMING = state.schedule;
    win.EVENTS = state.events;
    win.GALLERY = state.gallery;
    win.SECTIONS = sectionsWithComputedIds();
    win.SECTION_ORDER = serializableSectionOrder();

    // サイト本体と全く同じ関数を、上書きしたデータで実行し直す
    // （renderSections()が追加セクションのDOM/タグ要素を作ってから、
    // applySectionOrder()が固定ブロックと合わせて並び替え・番号振りをする
    // 順番。サイト本体側のinit処理と同じ順にすること）
    win.renderSite();
    win.renderTopics();
    if (typeof win.renderSchedule === "function") win.renderSchedule();
    win.renderEvents();
    win.renderGallery();
    win.renderSections();
    win.applySectionOrder();

    status.textContent = "";
    status.className = "status";
  } catch (e) {
    status.textContent = "プレビュー表示エラー: " + e.message;
    status.className = "status err";
  } finally {
    previewBtn.disabled = false;
  }
}

function closePreview() {
  el("previewOverlay").style.display = "none";
  const frame = el("previewFrame");
  // 以前はsrcdocでプレビューを表示していた名残でsrcdoc=""をここでセットしていたが、
  // srcdoc属性が残っているとsrc側のページ遷移より優先されてしまい、次に
  // プレビューを開いたときに空白ページのまま（renderSiteが見つからない）に
  // なる原因だった。src方式に統一したので、閉じるときはsrc属性ごと空にする
  frame.removeAttribute("srcdoc");
  frame.src = "about:blank";
}

async function saveToGitHub() {
  const status = el("saveStatus");
  el("saveBtn").disabled = true;
  status.textContent = "保存中…";
  status.className = "status busy";

  try {
    const newContent = buildUpdatedScriptContent();
    const b64 = btoa(unescape(encodeURIComponent(newContent)));

    const res = await fetch(`https://api.github.com/repos/${state.repo}/contents/script.js`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${state.token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: "サイト内容を更新（編集ページより）",
        content: b64,
        sha: state.sha,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `保存に失敗しました（${res.status}）`);
    }

    const data = await res.json();
    state.sha = data.content.sha;
    state.rawContent = newContent;
    hasUnsavedChanges = false;
    clearDraft();

    const pagesUrl = pagesUrlFromRepo(state.repo);
    status.innerHTML = "保存しました ✓（1〜2分でサイトに反映されます。すぐに変わらなくても、もう一度保存せずに少し待ってから再読み込みしてください）" +
      (pagesUrl ? ` <a href="${escapeAttr(pagesUrl)}" target="_blank" rel="noopener">公開サイトを見る →</a>` : "");
    status.className = "status ok";
  } catch (e) {
    status.textContent = "エラー: " + e.message;
    status.className = "status err";
  } finally {
    el("saveBtn").disabled = false;
  }
}
