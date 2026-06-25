#!/usr/bin/env node
/**
 * generate-sundays.js
 * 
 * Reads sundays-data.json and generates individual HTML pages for each
 * week of worship, plus an index page listing all Sundays.
 * 
 * Usage:
 *   node generate-sundays.js                  # generate all pages
 *   node generate-sundays.js --published-only  # only pages with isPublished: true
 *   node generate-sundays.js --week 2          # generate just week 2
 * 
 * Output: sundays/ directory with individual HTML files + index.html
 * 
 * After generating, commit and push to GitHub — Cloudflare auto-deploys.
 */

const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'sundays-data.json');
const OUTPUT_DIR = path.join(__dirname, 'sundays');
const SITE_URL = 'https://oceangrove.church';

// ─── Parse args ───────────────────────────────────────────
const args = process.argv.slice(2);
const publishedOnly = args.includes('--published-only');
const weekArg = args.indexOf('--week');
const singleWeek = weekArg !== -1 ? parseInt(args[weekArg + 1]) : null;

// ─── Load data ────────────────────────────────────────────
if (!fs.existsSync(DATA_FILE)) {
  console.error(`❌ Data file not found: ${DATA_FILE}`);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const { series, defaults, sundays } = data;

// ─── Ensure output directory ──────────────────────────────
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Helpers ──────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ─── Video embed helper ───────────────────────────────────
function videoEmbed(youtubeId, label, startSeconds) {
  if (youtubeId) {
    const start = startSeconds ? `&start=${startSeconds}` : '';
    return `<iframe src="https://www.youtube.com/embed/${escHtml(youtubeId)}?rel=0${start}" 
      title="${escHtml(label)}" frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen loading="lazy"></iframe>`;
  }
  return `<div class="video-placeholder">
    <div class="play-btn" aria-label="Video coming soon">▶</div>
    <span style="font-size:.85rem;opacity:.7">${escHtml(label)}</span>
  </div>`;
}

// ─── Build individual Sunday page ─────────────────────────
function buildSundayPage(sunday, prevSunday, nextSunday) {
  const s = sunday;
  const dateFormatted = formatDate(s.date);
  const pageUrl = `${SITE_URL}/sundays/${s.slug}`;

  // Pre-filled share text
  const shareText = `Hey — I heard something at Beach Church that stayed with me. It's called "${s.title}" and it's about ${s.heroTeaser.toLowerCase().replace(/\?$/, '')}. Worth a listen: ${pageUrl}`;

  // Outline HTML
  const outlineHtml = s.outline.map((pt, i) => `
              <div class="outline-point">
                <div class="pt-num">${i + 1}</div>
                <div>
                  <strong>${escHtml(pt.title)}</strong>
                  <p>${escHtml(pt.description)}</p>
                </div>
              </div>`).join('');

  // Reflection questions HTML
  const reflectHtml = s.reflectionQuestions.map(q => 
    `<li>${escHtml(q)}</li>`).join('\n              ');

  // Conversation starters HTML
  const convoHtml = s.conversationStarters.map(q => 
    `<li>${escHtml(q)}</li>`).join('\n              ');

  // Songs tabs + initial display
  const songTabsHtml = s.songs.length > 0 
    ? s.songs.map((song, i) => 
        `<button${i === 0 ? ' class="active"' : ''} onclick="showSong(${i}, this)" role="tab">${escHtml(song.title)}</button>`
      ).join('\n              ')
    : '<button class="active" role="tab">Songs coming soon</button>';

  const songDataJs = s.songs.length > 0
    ? `const songData = ${JSON.stringify(s.songs.map(song => ({
        title: song.title,
        position: song.position,
        key: song.key
      })))};`
    : 'const songData = [];';

  // Chapters HTML
  const defaultChapters = [
    { time: '0:00', label: 'Welcome & gathering' },
    { time: '3:00', label: `Opening worship — "${s.songs[0]?.title || 'Worship'}"` },
    { time: '8:00', label: `"${s.songs[1]?.title || 'Worship'}"` },
    { time: '14:00', label: `"${s.songs[2]?.title || 'Worship'}"` },
    { time: '20:00', label: `Scripture reading — ${s.scripture}` },
    { time: '22:00', label: `Message — "${s.title}"` },
    { time: '44:00', label: `Offering — "${s.songs[3]?.title || 'Worship'}"` },
    { time: '49:00', label: `Closing — "${s.songs[4]?.title || 'Worship'}"` },
    { time: '53:00', label: 'Benediction & sending' }
  ];
  const chapters = s.video.chapters.length > 0 ? s.video.chapters : defaultChapters;
  const chaptersHtml = chapters.map(ch => 
    `<a class="chapter-item" href="#"><span class="ts">${escHtml(ch.time)}</span><span class="ch-title">${escHtml(ch.label)}</span></a>`
  ).join('\n            ');

  // Prev/next nav
  const prevLink = prevSunday 
    ? `<a href="/sundays/${prevSunday.slug}">← ${prevSunday.title}</a>`
    : `<a href="#" class="disabled">← Previous week</a>`;
  const nextLink = nextSunday 
    ? `<a href="/sundays/${nextSunday.slug}">${nextSunday.title} →</a>`
    : `<a href="#" class="disabled">Next week →</a>`;

  // Beach Club card (only during summer)
  const beachClubCard = `
      <a class="connect-card" href="${escHtml(defaults.beachClubUrl)}">
        <div class="cc-icon">🏖️</div>
        <strong>Beach Club</strong>
        <span>Summer email + merch</span>
      </a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(s.title)} — ${dateFormatted} · St. Paul's Ocean Grove Church</title>
<meta name="description" content="${escHtml(series.name)}, Week ${s.weekNumber} — ${escHtml(s.scripture)}. Watch, reflect, and go deeper with this week's message from Beach Church.">
<meta property="og:title" content="${escHtml(s.title)} — Beach Church">
<meta property="og:description" content="${escHtml(s.heroTeaser)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="St. Paul's Ocean Grove Church">
<link rel="canonical" href="${pageUrl}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Karla:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/sunday.css">
</head>
<body>

<nav>
  <div class="nav-inner">
    <a class="logo" href="/">St. Paul's <span>Ocean Grove</span></a>
    <ul class="nav-links">
      <li><a href="/start-here">Visit</a></li>
      <li><a href="/sundays" style="color:var(--dawn)">Sundays</a></li>
      <li><a href="/connect">Connect</a></li>
      <li><a href="/give">Give</a></li>
    </ul>
    <a class="nav-cta" href="/start-here">Plan a Visit</a>
  </div>
</nav>

<div class="tunnel-progress" aria-label="Page sections">
  <div class="prog-dot active" data-section="hero" title="Top"></div>
  <div class="prog-dot" data-section="taste" title="Watch"></div>
  <div class="prog-dot" data-section="message" title="Message"></div>
  <div class="prog-dot" data-section="deeper" title="Go deeper"></div>
  <div class="prog-dot" data-section="connect-section" title="Connect"></div>
  <div class="prog-dot" data-section="invite-section" title="Share"></div>
</div>

<!-- ═══ HERO ═══ -->
<header class="sunday-hero" id="hero">
  <div class="wrap">
    <div class="series-badge"><div class="dot"></div>${escHtml(series.name)} · Week ${s.weekNumber}</div>
    <h1 class="display">${escHtml(s.title)}</h1>
    <div class="hero-meta">
      <span><strong>${dateFormatted}</strong></span>
      <span>Beach Church · 9 AM</span>
      <span>${escHtml(s.speaker)}</span>
    </div>
    <div class="scripture-ref">${escHtml(s.scripture)}</div>
    <p class="hero-teaser">${escHtml(s.heroTeaser)}</p>
  </div>
</header>

<svg class="tideline" viewBox="0 0 1440 50" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,5 1440,30 L1440,0 L0,0 Z" fill="#0E2235" opacity="0.15"/>
  <path d="M0,30 C260,55 520,5 760,28 C1000,50 1240,8 1440,35 L1440,0 L0,0 Z" fill="#0E2235"/>
</svg>

<!-- ═══ STAGE 1: THE TASTE ═══ -->
<section class="tunnel-section" id="taste">
  <div class="wrap">
    <div class="section-label">
      <div class="num">1</div>
      <h2>60 seconds</h2>
    </div>
    <div class="video-wrap">
      ${videoEmbed(s.video.clipId, 'The strongest 60 seconds from Sunday')}
    </div>
    <p class="video-caption">Short clip · share-ready</p>
  </div>
</section>

<!-- ═══ SHAREABLE PULLQUOTE ═══ -->
<div class="wrap">
  <div class="pullquote">
    <blockquote>"${escHtml(s.pullquote.text)}"</blockquote>
    <div class="pq-meta">— ${escHtml(s.pullquote.attribution)} · ${formatDateShort(s.date)}</div>
    <div class="share-row">
      <button class="share-pill sp-text" onclick="shareQuoteText()" aria-label="Share via text">💬 Text</button>
      <button class="share-pill sp-copy" onclick="copyQuote()" aria-label="Copy quote">📋 Copy</button>
      <button class="share-pill sp-ig" aria-label="Share to stories">📸 Story</button>
    </div>
  </div>
</div>

<!-- ═══ STAGE 2: THE MESSAGE ═══ -->
<section class="tunnel-section" id="message">
  <div class="wrap">
    <div class="section-label">
      <div class="num">2</div>
      <h2>The message</h2>
    </div>

    <div class="video-wrap" style="margin-bottom:20px">
      ${videoEmbed(s.video.serviceId, `Full sermon · "${s.title}"`)}
    </div>

    <div class="expand-group">
      <div class="expand-card" id="card-scripture">
        <button class="expand-trigger" onclick="toggleCard('card-scripture')" aria-expanded="false">
          <span class="icon-label">
            <span class="card-icon" style="background:rgba(46,126,120,.12);color:var(--tide)">📖</span>
            Read the passage — ${escHtml(s.scripture)}
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="expand-body">
          <div class="expand-content">
            <div class="scripture-block">
              <em>Scripture text will be populated from the Bible API or manual entry.</em>
              <span class="ref">${escHtml(s.scripture)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="expand-card" id="card-outline">
        <button class="expand-trigger" onclick="toggleCard('card-outline')" aria-expanded="false">
          <span class="icon-label">
            <span class="card-icon" style="background:rgba(224,164,88,.12);color:var(--dawn)">📝</span>
            Message outline
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="expand-body">
          <div class="expand-content">${outlineHtml}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ STAGE 3: GO DEEPER ═══ -->
<section class="tunnel-section" id="deeper">
  <div class="wrap">
    <div class="section-label">
      <div class="num">3</div>
      <h2>Go deeper</h2>
    </div>

    <div class="expand-group">
      <div class="expand-card" id="card-reflect">
        <button class="expand-trigger" onclick="toggleCard('card-reflect')" aria-expanded="false">
          <span class="icon-label">
            <span class="card-icon" style="background:rgba(46,126,120,.12);color:var(--tide)">💭</span>
            Reflection questions
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="expand-body">
          <div class="expand-content">
            <ul class="question-list">
              ${reflectHtml}
            </ul>
          </div>
        </div>
      </div>

      <div class="expand-card" id="card-convo">
        <button class="expand-trigger" onclick="toggleCard('card-convo')" aria-expanded="false">
          <span class="icon-label">
            <span class="card-icon" style="background:rgba(224,164,88,.12);color:var(--dawn)">🗣️</span>
            Conversation starters
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="expand-body">
          <div class="expand-content">
            <p><strong>For a small group or over coffee:</strong></p>
            <ul class="question-list">
              ${convoHtml}
            </ul>
          </div>
        </div>
      </div>

      <div class="expand-card" id="card-practice">
        <button class="expand-trigger" onclick="toggleCard('card-practice')" aria-expanded="false">
          <span class="icon-label">
            <span class="card-icon" style="background:rgba(46,126,120,.12);color:var(--tide)">🌊</span>
            Practice for the week
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="expand-body">
          <div class="expand-content">
            <div class="practice-card">
              <h4>${escHtml(s.spiritualPractice.title)}</h4>
              <p>${escHtml(s.spiritualPractice.description)}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="expand-card" id="card-lyrics">
        <button class="expand-trigger" onclick="toggleCard('card-lyrics')" aria-expanded="false">
          <span class="icon-label">
            <span class="card-icon" style="background:rgba(14,34,53,.08);color:var(--ink)">🎵</span>
            Worship lyrics
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="expand-body">
          <div class="expand-content">
            <div class="song-tab" role="tablist">
              ${songTabsHtml}
            </div>
            <div class="lyrics-block" id="lyrics-display">
              <em>Lyrics loaded from CCLI SongSelect via NocoDB.</em>
              <div class="song-meta">CCLI License · Lyrics used by permission</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top:20px;display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
      <a class="print-link" href="/sundays/${s.slug}-print.pdf">🖨️ Printable study guide</a>
      <a class="print-link" href="${escHtml(defaults.podcastUrl)}">🎧 Listen on podcast</a>
    </div>
  </div>
</section>

<!-- ═══ FULL SERVICE ═══ -->
<section class="tunnel-section" style="padding-bottom:0">
  <div class="wrap">
    <div class="expand-card" id="card-fullservice">
      <button class="expand-trigger" onclick="toggleCard('card-fullservice')" aria-expanded="false">
        <span class="icon-label">
          <span class="card-icon" style="background:rgba(14,34,53,.08);color:var(--ink)">📺</span>
          Watch the full worship service
        </span>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="expand-body">
        <div class="expand-content">
          <div class="video-wrap" style="margin-bottom:16px">
            ${videoEmbed(s.video.serviceId, 'Full worship service')}
          </div>
          <p style="font-weight:600;margin-bottom:10px;">Jump to a section:</p>
          <div class="chapter-list">
            ${chaptersHtml}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ CONNECT ═══ -->
<section class="connect-strip" id="connect-section">
  <div class="wrap">
    <div style="text-align:center;margin-bottom:24px;">
      <div class="eyebrow" style="color:var(--tide-light)">Take a step</div>
    </div>
    <div class="connect-grid">${beachClubCard}
      <a class="connect-card" href="${escHtml(defaults.prayerUrl)}">
        <div class="cc-icon">🙏</div>
        <strong>Prayer</strong>
        <span>Submit a request</span>
      </a>
      <a class="connect-card" href="${escHtml(defaults.giveUrl)}">
        <div class="cc-icon">💛</div>
        <strong>Give</strong>
        <span>Support this ministry</span>
      </a>
      <a class="connect-card" href="${escHtml(defaults.startHereUrl)}">
        <div class="cc-icon">👋</div>
        <strong>I'm New</strong>
        <span>Start here</span>
      </a>
      <a class="connect-card" href="#">
        <div class="cc-icon">📱</div>
        <strong>Get Texts</strong>
        <span>Weekly update</span>
      </a>
      <a class="connect-card" href="${escHtml(defaults.devotionalUrl)}">
        <div class="cc-icon">📖</div>
        <strong>Free Devotional</strong>
        <span>Five Mornings by the Sea</span>
      </a>
    </div>
  </div>
</section>

<!-- ═══ INVITE ═══ -->
<section class="invite-final" id="invite-section">
  <div class="wrap">
    <h2 class="display">Something here worth sharing?</h2>
    <p>If this landed for you, it might land for someone else too. Ten seconds to send.</p>
    <div class="invite-actions">
      <button class="btn btn-dawn" onclick="sharePageText()">💬 Text a friend</button>
      <button class="btn btn-ink" onclick="sharePage()">📤 Share this page</button>
      <button class="btn btn-ghost-dark" onclick="copyLink()">🔗 Copy link</button>
    </div>
    <div class="social-bar">
      <a class="social-link" href="${escHtml(defaults.instagram)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
        Follow
      </a>
      <a class="social-link" href="${escHtml(defaults.youtubeChannel)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
        Subscribe
      </a>
      <a class="social-link" href="${escHtml(defaults.facebook)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3.1 1.8-4.8 4.6-4.8 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"/></svg>
        Like
      </a>
    </div>

    <div class="week-nav">
      ${prevLink}
      ${nextLink}
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="foot-logo">St. Paul's <span>Ocean Grove</span> Church</div>
    <div class="foot-detail">${escHtml(defaults.time)} · ${escHtml(defaults.location)}</div>
    <ul class="foot-links">
      <li><a href="/">Home</a></li>
      <li><a href="/start-here">Visit</a></li>
      <li><a href="/sundays">All Sundays</a></li>
      <li><a href="/connect">Connect</a></li>
      <li><a href="/give">Give</a></li>
    </ul>
    <div class="foot-bottom">© 2026 St. Paul's Ocean Grove Church · A United Methodist Congregation</div>
  </div>
</footer>

<script>
  // Accordion
  function toggleCard(id) {
    const card = document.getElementById(id);
    const trigger = card.querySelector('.expand-trigger');
    if (card.hasAttribute('open')) {
      card.removeAttribute('open');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      card.setAttribute('open', '');
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  // Songs
  ${songDataJs}
  function showSong(index, btn) {
    document.querySelectorAll('.song-tab button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (songData[index]) {
      const s = songData[index];
      document.getElementById('lyrics-display').innerHTML = 
        '<em>"' + s.title + '" (Key of ' + s.key + ') — ' + s.position + '</em>\\n\\nLyrics loaded from NocoDB Songs table.\\n<div class="song-meta">CCLI License · Lyrics used by permission</div>';
    }
  }

  // Share
  const pageUrl = '${pageUrl}';
  const pageTitle = '${escJs(s.title)} — Beach Church';
  const shareMsg = '${escJs(shareText)}';
  const quoteText = '"${escJs(s.pullquote.text)}" — ${escJs(s.pullquote.attribution)}, Beach Church\\n${pageUrl}';

  function sharePageText() {
    if (navigator.share) { navigator.share({ text: shareMsg }); }
    else { window.open('sms:?body=' + encodeURIComponent(shareMsg)); }
  }
  function sharePage() {
    if (navigator.share) { navigator.share({ title: pageTitle, text: '${escJs(s.heroTeaser)}', url: pageUrl }); }
  }
  function copyLink() {
    navigator.clipboard.writeText(pageUrl);
    showToast('Link copied');
  }
  function shareQuoteText() {
    if (navigator.share) { navigator.share({ text: quoteText }); }
    else { window.open('sms:?body=' + encodeURIComponent(quoteText)); }
  }
  function copyQuote() {
    navigator.clipboard.writeText(quoteText);
    showToast('Quote copied');
  }
  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0E2235;color:#F7F4ED;padding:12px 24px;border-radius:999px;font-weight:600;font-size:.9rem;z-index:99;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  // Scroll spy for progress dots
  const sections = ['hero','taste','message','deeper','connect-section','invite-section'];
  const dots = document.querySelectorAll('.prog-dot');
  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    document.getElementById(sections[i])?.scrollIntoView({ behavior: 'smooth' });
  }));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target.id);
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
</script>

</body>
</html>`;
}

// ─── Build the Sundays index page ─────────────────────────
function buildIndexPage(sundays) {
  const publishedSundays = sundays.filter(s => s.isPublished);
  const upcomingSundays = sundays.filter(s => !s.isPublished);

  function sundayCard(s, isUpcoming) {
    const dateFormatted = formatDate(s.date);
    const opacity = isUpcoming ? 'opacity:.6;' : '';
    const badge = isUpcoming 
      ? '<span class="upcoming-badge">Coming soon</span>' 
      : '';
    const link = isUpcoming 
      ? '#' 
      : `/sundays/${s.slug}`;
    return `
      <a class="sunday-card ${isUpcoming ? 'upcoming' : ''}" href="${link}" ${isUpcoming ? 'style="pointer-events:none"' : ''}>
        <div class="sc-week">Week ${s.weekNumber}</div>
        <div class="sc-main">
          <h3>${escHtml(s.title)}</h3>
          <div class="sc-meta">${dateFormatted} · ${escHtml(s.speaker)}</div>
          <div class="sc-scripture">${escHtml(s.scripture)}</div>
        </div>
        ${badge}
      </a>`;
  }

  const publishedCards = publishedSundays.reverse().map(s => sundayCard(s, false)).join('');
  const upcomingCards = upcomingSundays.map(s => sundayCard(s, true)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sundays — ${escHtml(series.name)} · St. Paul's Ocean Grove Church</title>
<meta name="description" content="Watch, read, and reflect on every message from Beach Church's ${escHtml(series.name)} series. Summer 2026.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Karla:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/sunday.css">
<style>
  .index-hero { background:linear-gradient(178deg,#08141F 0%,#0E2235 50%,#2E7E78 105%);color:var(--foam);padding:64px 0 48px; }
  .index-hero h1 { font-size:clamp(2rem,5vw,3rem);font-weight:500;margin-bottom:8px; }
  .index-hero p { opacity:.85;font-size:1.05rem;max-width:40ch; }
  .sundays-list { padding:40px 0 60px; }
  .sunday-card { display:flex;align-items:center;gap:16px;padding:20px;background:#fff;border:1px solid var(--sand);border-radius:14px;text-decoration:none;color:var(--ink);margin-bottom:12px;transition:transform .15s,box-shadow .15s; }
  .sunday-card:hover { transform:translateY(-3px);box-shadow:0 8px 24px rgba(14,34,53,.08); }
  .sunday-card.upcoming { background:var(--sand);opacity:.7; }
  .sc-week { font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--tide);writing-mode:vertical-lr;transform:rotate(180deg);flex:none; }
  .sc-main { flex:1; }
  .sc-main h3 { font-family:'Fraunces',serif;font-size:1.25rem;font-weight:500;margin-bottom:4px; }
  .sc-meta { font-size:.88rem;color:var(--drift); }
  .sc-scripture { font-size:.85rem;color:var(--tide);font-style:italic;margin-top:2px; }
  .upcoming-badge { font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--drift);background:var(--foam);padding:4px 10px;border-radius:999px; }
  .section-divider { font-family:'Fraunces',serif;font-size:1.1rem;font-weight:500;color:var(--drift);margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--sand); }
</style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <a class="logo" href="/">St. Paul's <span>Ocean Grove</span></a>
    <ul class="nav-links">
      <li><a href="/start-here">Visit</a></li>
      <li><a href="/sundays" style="color:var(--dawn)">Sundays</a></li>
      <li><a href="/connect">Connect</a></li>
      <li><a href="/give">Give</a></li>
    </ul>
    <a class="nav-cta" href="/start-here">Plan a Visit</a>
  </div>
</nav>

<header class="index-hero">
  <div class="wrap">
    <div class="eyebrow" style="color:var(--tide-light)">${escHtml(series.season)}</div>
    <h1 class="display">${escHtml(series.name)}</h1>
    <p>Every Sunday's message — watch, reflect, go deeper, share.</p>
  </div>
</header>

<svg class="tideline" viewBox="0 0 1440 50" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0,25 C240,50 480,0 720,25 C960,50 1200,5 1440,30 L1440,0 L0,0 Z" fill="#0E2235" opacity="0.15"/>
  <path d="M0,30 C260,55 520,5 760,28 C1000,50 1240,8 1440,35 L1440,0 L0,0 Z" fill="#0E2235"/>
</svg>

<section class="sundays-list">
  <div class="wrap">
    ${publishedCards ? '<div class="section-divider">Latest</div>' + publishedCards : ''}
    ${upcomingCards ? '<div class="section-divider">Coming up</div>' + upcomingCards : ''}
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="foot-logo">St. Paul's <span>Ocean Grove</span> Church</div>
    <div class="foot-detail">${escHtml(defaults.time)} · ${escHtml(defaults.location)}</div>
    <div class="foot-bottom">© 2026 St. Paul's Ocean Grove Church · A United Methodist Congregation</div>
  </div>
</footer>

</body>
</html>`;
}

// ─── Generate ─────────────────────────────────────────────
console.log(`\n🌊 SPOGC Sunday Page Generator`);
console.log(`   Series: ${series.name}`);
console.log(`   Sundays: ${sundays.length} weeks loaded\n`);

let generated = 0;
let skipped = 0;

sundays.forEach((sunday, index) => {
  // Filter checks
  if (singleWeek && sunday.weekNumber !== singleWeek) return;
  if (publishedOnly && !sunday.isPublished) { skipped++; return; }

  const prev = index > 0 ? sundays[index - 1] : null;
  const next = index < sundays.length - 1 ? sundays[index + 1] : null;
  
  const html = buildSundayPage(sunday, prev, next);
  const outPath = path.join(OUTPUT_DIR, `${sunday.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  
  const status = sunday.isPublished ? '✅' : '⏳';
  const videoStatus = sunday.video.serviceId ? '🎬' : '  ';
  console.log(`  ${status} ${videoStatus} Week ${String(sunday.weekNumber).padStart(2)} · ${sunday.slug}.html`);
  generated++;
});

// Generate index page
const indexHtml = buildIndexPage(sundays);
fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf8');
console.log(`\n  📋 index.html (Sundays archive)\n`);

console.log(`Generated: ${generated} pages + index`);
if (skipped) console.log(`Skipped: ${skipped} unpublished`);
console.log(`Output: ${OUTPUT_DIR}/`);
console.log(`\nNext: commit and push to deploy.\n`);
