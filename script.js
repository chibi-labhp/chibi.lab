/* ============================================================
   ここから下、SITE / TOPICS / EVENTS / GALLERY の中身を書き換える
   だけでサイトの表示が更新されます。HTML/CSSは触らなくてOKです。
   ============================================================ */

// ---- サイト全体の文言（ヒーロー・ABOUT・お問い合わせ） ----
var SITE = {
  "heroOrg": "東京理科大学 サイエンスコミュニケーションサークル",
  "heroKana": "（ちびラボ）",
  "heroTagline": "むずかしそうを、おもしろそうに。",
  "heroLead": "実験や工作、サイエンスショーを通じて、子どもたちに「科学っておもしろい」を届ける学生サークルです。",
  "aboutBody1": "chibi lab. は、2012年10月に東京理科大学の学生10名で発足したサイエンスコミュニケーションサークルです。科学館や図書館、地域のお祭りなどに出展し、実験ショーや工作教室を通じて子どもたちと科学のふれあいをつくっています。",
  "aboutBody2": "そんなモットーのもと、大学で学んだ知識を分かりやすく・楽しく届ける方法を、部員同士で日々研究しています。学年を問わず、部員は随時募集中です。",
  "aboutPoint1": "科学館・図書館でのサイエンスショー出展",
  "aboutPoint2": "工作イベント・ワークショップの企画運営",
  "aboutPoint3": "YouTube・SNSでの科学コンテンツ発信",
  "contactBody": "実験教室・サイエンスショーのご依頼は、日時・場所・対象学年・人数などを明記のうえメールでご連絡ください（遅くとも希望日の1ヶ月前までにご連絡ください）。取材やその他のお問い合わせは、下記フォームからどうぞ。",
  "contactEmail": "chibi.lab.chibi@gmail.com",
  "contactFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLSfsTu5M_ln2tvkn-N3_2mbyWaHF6K3KrXiTiSE6LW2xmBJP7Q/viewform",
  "snsX": "https://twitter.com/chibi_lab",
  "snsInstagram": "https://www.instagram.com/chibi_lab/",
  "snsYoutube": "https://www.youtube.com/channel/UCPiOUgdJ0pQmk5F_H9Do_Ig"
};

// ---- お知らせ（新しいものを配列の先頭に追加してください。image は省略可） ----
var TOPICS = [
  {
    "date": "2026.08.13",
    "title": "公式サイトをリニューアルしました",
    "body": "FC2ホームページからこの新しいサイトに移行しました。今後のお知らせはこちらに掲載していきます。"
  }
];

// ---- イベント情報（新しいものを配列の先頭に追加してください） ----
var EVENTS = [
  {
    "date": "2024.03.02",
    "title": "入浴剤を作ってみよう!! 水の中でもシャボン玉ができる!?",
    "place": "東芝未来科学館",
    "body": "小学1〜6年生を対象に、入浴剤づくりと水中シャボン玉の実験ブースを出展しました。"
  },
  {
    "date": "2024.02.04",
    "title": "科学実験ワークショップ",
    "place": "下落合図書館（新宿区立図書館）",
    "body": "地域の図書館で、親子向けの科学実験ワークショップを行いました。"
  },
  {
    "date": "2023.11.24–25",
    "title": "理大祭",
    "place": "東京理科大学 神楽坂キャンパス",
    "body": "学園祭「理大祭」にブース出展。実験ショーと工作コーナーで来場者を迎えました。"
  },
  {
    "date": "2023.11.04",
    "title": "サイエンスイベント出展",
    "place": "東芝未来科学館",
    "body": "東芝未来科学館の館内イベントに出展しました。"
  },
  {
    "date": "2023.10.08",
    "title": "みらい研究室 科学へのトビラ",
    "place": "東京理科大学 神楽坂キャンパス",
    "body": "年に数回開催される「みらい研究室」に出展。実験ショーと工作教室を行いました。"
  },
  {
    "date": "2016.08.13–14",
    "title": "サイエンスリンク",
    "place": "日本科学未来館",
    "body": "クントの実験や紙コップ工作のブースを出展し、来場者投票の「お客様賞」を受賞しました。"
  }
];

// ---- ギャラリー写真（本番では画像ファイルに差し替えてください） ----
// image: 画像パス（例 "images/event01.jpg"）。空のままなら色付きプレースホルダーが表示されます。
var GALLERY = [
  {
    "image": "images/chibilab-miraiken-2016-03-dryice.jpg",
    "color": "#AB511F",
    "caption": "みらい研究室（2016年3月・堀切地区センター）のドライアイス実験ショー",
    "tilt": -2
  },
  {
    "image": "images/chibilab-ridaisai-2016-11-purplecabbage.jpg",
    "color": "#D7862E",
    "caption": "理大祭（2016年11月）の紫キャベツ液を使ったお絵描き実験",
    "tilt": 1.5
  },
  {
    "image": "images/chibilab-birthday-2016-10-cake.jpg",
    "color": "#FF0080",
    "caption": "chibi lab. 4周年生誕祭（2016年10月）のお祝いケーキ",
    "tilt": -1
  },
  {
    "image": "images/chibilab-natsugasshuku-2016-08-farm.jpg",
    "color": "#AB511F",
    "caption": "夏合宿（2016年8月・栃木県那須町）で訪れた南ヶ丘牧場",
    "tilt": 2
  },
  {
    "image": "images/chibilab-sciencelink-2016-08-award.jpg",
    "color": "#D7862E",
    "caption": "サイエンスリンク（2016年8月・日本科学未来館）でお客様賞を受賞した全員集合写真",
    "tilt": -1.5
  },
  {
    "image": "images/chibilab-miraiken-2016-06-booth.jpg",
    "color": "#FF0080",
    "caption": "みらい研究室（2016年6月・日本科学未来館）のちびらぼブース",
    "tilt": 2.5
  },
  {
    "image": "images/chibilab-shinkan-bbq-2016-05.jpg",
    "color": "#AB511F",
    "caption": "新歓BBQ（2016年5月・二子新地）の新メンバー集合写真",
    "tilt": -2
  },
  {
    "image": "images/chibilab-fuyugasshuku-2015-02-fujisan.jpg",
    "color": "#D7862E",
    "caption": "冬合宿（2015年2月・山梨）で見た雄大な富士山",
    "tilt": 1
  },
  {
    "image": "images/chibilab-ridaisai-2015-11-group.jpg",
    "color": "#FF0080",
    "caption": "理大祭（2015年11月）2日間の展示を終えての集合写真",
    "tilt": -2.5
  },
  {
    "image": "images/chibilab-birthday-2015-10-cake.jpg",
    "color": "#AB511F",
    "caption": "chibi lab. 3周年を祝う誕生日ケーキ（2015年10月）",
    "tilt": 1.5
  },
  {
    "image": "images/chibilab-natsugasshuku-2015-08-bbq.jpg",
    "color": "#D7862E",
    "caption": "夏合宿（2015年8月・新潟）2日目のバーベキュー",
    "tilt": -1
  },
  {
    "image": "images/chibilab-sciencelink-2015-08-award.jpg",
    "color": "#FF0080",
    "caption": "サイエンスリンク（2015年8月）でお客様賞を受賞した瞬間",
    "tilt": 2
  },
  {
    "image": "images/chibilab-miraiken-2015-06-booth.jpg",
    "color": "#AB511F",
    "caption": "みらい研究室（2015年6月・日本科学未来館）の実験ブースが大盛況",
    "tilt": -1.5
  },
  {
    "image": "images/chibilab-ichigaya-es-2015-05-benham.jpg",
    "color": "#D7862E",
    "caption": "市ヶ谷小学校サイエンスフェスタ（2015年5月）でベンハムのこま工作",
    "tilt": 2.5
  },
  {
    "image": "images/chibilab-sciencelink-2014-03-award.jpg",
    "color": "#FF0080",
    "caption": "サイエンスリンク（2014年3月）でお客様賞を受賞したときの様子",
    "tilt": -2
  },
  {
    "image": "images/chibilab-miraiken-2014-06-miraikan.jpg",
    "color": "#AB511F",
    "caption": "日本科学未来館で開催された「みらい研究室」（2014年6月）でのブース出展",
    "tilt": 1
  },
  {
    "image": "images/chibilab-ridaisai-2014-11-spectroscope.jpg",
    "color": "#D7862E",
    "caption": "理大祭（2014年11月）の分光器づくりで虹を観察する子どもたち",
    "tilt": -1.5
  },
  {
    "image": "images/chibilab-nishishinjuku-es-2014-10-airgun.jpg",
    "color": "#FF0080",
    "caption": "西新宿小学校実験教室（2014年10月）で空気砲の的当てに夢中になる児童",
    "tilt": 2
  }
];

// ---- 追加セクション（GALLERYとCONTACTの間に自由に増やせます） ----
// 各セクションの items は { title, body, image, link } のカード一覧です（image/linkは省略可）
var SECTIONS = [];

// ---- ページの並び順（ABOUT・お知らせ・イベント情報・ギャラリーの表示順） ----
// この4つの並び順を入れ替えたいときは、配列の中身の順番を書き換えてください
var SECTION_ORDER = [
  "about",
  "topics",
  "events",
  "gallery"
];

/* ============================================================
   ここから下は表示のしくみです。通常は触らなくて大丈夫です。
   ============================================================ */

function renderSite() {
  document.getElementById("hero-org").textContent = SITE.heroOrg;
  document.getElementById("hero-kana").textContent = SITE.heroKana;
  document.getElementById("hero-tagline").textContent = SITE.heroTagline;
  document.getElementById("hero-lead").textContent = SITE.heroLead;
  document.getElementById("about-body-1").textContent = SITE.aboutBody1;
  document.getElementById("about-body-2").textContent = SITE.aboutBody2;
  document.getElementById("about-point-1").textContent = SITE.aboutPoint1;
  document.getElementById("about-point-2").textContent = SITE.aboutPoint2;
  document.getElementById("about-point-3").textContent = SITE.aboutPoint3;
  document.getElementById("contact-body").textContent = SITE.contactBody;

  const email = document.getElementById("contact-email");
  email.textContent = SITE.contactEmail;
  email.href = "mailto:" + SITE.contactEmail;

  document.getElementById("contact-form-link").href = SITE.contactFormUrl;
  document.getElementById("sns-x").href = SITE.snsX;
  document.getElementById("sns-instagram").href = SITE.snsInstagram;
  document.getElementById("sns-youtube").href = SITE.snsYoutube;
}

function renderTopics() {
  const list = document.getElementById("topics-list");
  list.innerHTML = TOPICS.map(t => `
    <article class="event-entry">
      <div class="event-date">${t.date}</div>
      <div class="event-body">
        <h3>${t.title}</h3>
        <p>${t.body}</p>
        ${t.image ? `<img class="topic-image" src="${t.image}" alt="${t.title}">` : ""}
      </div>
    </article>
  `).join("");
}

function renderEvents() {
  const list = document.getElementById("events-list");
  list.innerHTML = EVENTS.map(ev => `
    <article class="event-entry">
      <div class="event-date">${ev.date}</div>
      <div class="event-body">
        <h3>${ev.title}</h3>
        <p>${ev.body}</p>
        <span class="event-location">${ev.place}</span>
      </div>
    </article>
  `).join("");
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = GALLERY.map(g => `
    <div class="photo-card" style="--tilt:${g.tilt || 0}deg">
      ${
        g.image
          ? `<img class="photo-placeholder" src="${g.image}" alt="${g.caption}" style="object-fit:cover;width:100%;">`
          : `<div class="photo-placeholder" style="background:${g.color}">画像を追加</div>`
      }
      <p class="photo-caption">${g.caption}</p>
    </div>
  `).join("");
}

// ABOUT・お知らせ・イベント情報・ギャラリーの4ブロックを、SECTION_ORDER の
// 順番どおりに並べ替える（同じ要素を移動するだけなので、内容はそのまま）
// ABOUT/TOPICS/EVENTS/GALLERYの固定ブロックと、STEP7で作った追加セクション
// （SECTIONS配列の各要素）を、1本の順番としてまとめて並び替える。追加セクション
// はSECTION_ORDER内でそれぞれ自分のid（例: "section-1"）として直接登場するので、
// 固定ブロックの間に個別に割り込ませることもできる。SECTION_ORDERに登場しない
// 追加セクションは、これまで通り一番下に足す（後方互換：追加セクションに一切
// 触れていない古いSECTION_ORDERでも、これまで通り末尾に表示される）。
function applySectionOrder() {
  const main = document.getElementById("top");
  const contactSection = document.getElementById("contact");
  if (!main || !contactSection) return;

  const labels = {
    about: { name: "ABOUT", tagClass: "tag-teal" },
    topics: { name: "TOPICS", tagClass: "tag-magenta" },
    events: { name: "EVENTS", tagClass: "tag-amber" },
    gallery: { name: "GALLERY", tagClass: "tag-magenta" },
  };
  const customTagClasses = ["tag-teal", "tag-amber", "tag-magenta"];
  const contactLink = document.querySelector('.site-nav a[href="#contact"]');
  const customById = {};
  SECTIONS.forEach((s, i) => { customById[s.id] = { section: s, i }; });

  // SECTION_ORDERに載っていない固定ブロックは非表示にする（中身は消えない）
  Object.keys(labels).forEach(key => {
    if (SECTION_ORDER.includes(key)) return;
    const section = document.getElementById(key);
    const navLink = document.querySelector(`.site-nav a[href="#${key}"]`);
    if (section) section.style.display = "none";
    if (navLink) navLink.style.display = "none";
  });

  // "custom"（旧バージョンが使っていたまとめキー）が残っていたら、その位置に
  // まだ登場していない追加セクションを展開する
  const order = [];
  SECTION_ORDER.forEach(key => {
    if (key === "custom") {
      SECTIONS.forEach(s => { if (!order.includes(s.id)) order.push(s.id); });
      return;
    }
    order.push(key);
  });
  // SECTION_ORDERに一度も出てこない追加セクションは末尾に足す
  SECTIONS.forEach(s => { if (!order.includes(s.id)) order.push(s.id); });

  let num = 1;
  order.forEach(key => {
    const custom = customById[key];
    if (custom) {
      const s = custom.section;
      const section = document.getElementById(s.id);
      const navLink = document.querySelector(`.site-nav [data-custom-nav][href="#${s.id}"]`);
      const tag = document.getElementById(s.id + "-tag");
      if (!section) return;

      main.insertBefore(section, contactSection);
      if (navLink && contactLink) contactLink.parentNode.insertBefore(navLink, contactLink);
      if (tag) {
        tag.textContent = `${String(num).padStart(2, "0")} / ${s.navLabel}`;
        tag.className = "tag " + customTagClasses[custom.i % customTagClasses.length];
      }
      num++;
      return;
    }

    const section = document.getElementById(key);
    const tag = document.getElementById(key + "-tag");
    const navLink = document.querySelector(`.site-nav a[href="#${key}"]`);
    if (!section || !labels[key]) return;

    section.style.display = "";
    if (navLink) navLink.style.display = "";

    main.insertBefore(section, contactSection);
    if (navLink && contactLink) contactLink.parentNode.insertBefore(navLink, contactLink);

    if (tag) {
      tag.textContent = `${String(num).padStart(2, "0")} / ${labels[key].name}`;
      tag.className = "tag " + labels[key].tagClass;
    }
    num++;
  });

  const contactTag = document.getElementById("contact-tag");
  if (contactTag) contactTag.textContent = `${String(num).padStart(2, "0")} / CONTACT`;
}

// 追加セクションの中身（見出し・項目など）を作るだけで、実際の表示位置と
// タグの番号（01/02...）はapplySectionOrder()がSECTION_ORDERを見て決める
// （固定ブロックと通し番号で振り直すため）。この関数は必ずapplySectionOrder()
// より先に呼ぶこと。
function renderSections() {
  const container = document.getElementById("custom-sections");
  const contactLink = document.querySelector('.site-nav a[href="#contact"]');
  if (!container) return;

  // 前回分の追加セクション本体・ナビリンクが残っていたら消してから作り直す。
  // applySectionOrder()が各セクションをcustom-sectionsの外（mainの直下）へ
  // 移動させるため、containerのinnerHTML書き換えだけでは消えない
  document.querySelectorAll("[data-custom-section]").forEach(elm => elm.remove());
  document.querySelectorAll(".site-nav [data-custom-nav]").forEach(a => a.remove());

  SECTIONS.forEach(s => {
    if (contactLink) {
      contactLink.insertAdjacentHTML(
        "beforebegin",
        `<a href="#${s.id}" data-custom-nav>${s.navLabel}</a>`
      );
    }
  });

  container.innerHTML = SECTIONS.map((s, i) => `
    <section id="${s.id}" data-custom-section class="section ${i % 2 === 0 ? "section-alt" : ""}">
      <div class="section-head">
        <span class="tag" id="${s.id}-tag"></span>
        <h2>${s.title}</h2>
      </div>
      ${s.intro ? `<p class="section-note">${s.intro}</p>` : ""}
      <div class="items-grid">
        ${s.items.map(it => `
          <div class="item-card">
            ${it.image ? `<img src="${it.image}" alt="${it.title}">` : ""}
            <h3>${it.title}</h3>
            <p>${it.body}</p>
            ${it.link ? `<a class="item-link" href="${it.link}" target="_blank" rel="noopener">詳しくはこちら →</a>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");
}

// モバイルメニュー開閉
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.getElementById("year").textContent = new Date().getFullYear();

renderSite();
renderTopics();
renderEvents();
renderGallery();
renderSections();
applySectionOrder();
initNavToggle();
