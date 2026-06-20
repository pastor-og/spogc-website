/* ═══════════════════════════════════════════════
   SPOGC — Content loader
   Reads content.json, populates every page.
   ═══════════════════════════════════════════════ */

(async function () {
  let data;
  try {
    const resp = await fetch('/content.json');
    data = await resp.json();
  } catch (e) {
    console.warn('content.json not loaded — static fallback in use.', e);
    return;
  }

  /* ── Helpers ── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function set(sel, text) {
    const el = $(sel);
    if (el) el.textContent = text;
  }

  function setHTML(sel, html) {
    const el = $(sel);
    if (el) el.innerHTML = html;
  }

  /* ── Nav mobile toggle ── */
  const toggle = $('.nav-toggle');
  const navLinks = $('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.textContent = isOpen ? '✕' : '☰';
    });
  }

  /* ── Homepage: Pathways ── */
  const pathContainer = $('.paths');
  if (pathContainer && data.pathways) {
    const order = ['beginning', 'returning', 'deepening'];
    pathContainer.innerHTML = order.map(key => {
      const p = data.pathways[key];
      return `
        <a class="path" href="${p.linkUrl}">
          <div class="wave" aria-hidden="true"></div>
          <div class="stage">${p.stage}</div>
          <h3>${p.title}</h3>
          <p>${p.body}</p>
          <span class="go">${p.linkText}</span>
        </a>`;
    }).join('');
  }

  /* ── Homepage: Times bar ── */
  const timesBar = $('.times-inner');
  if (timesBar && data.service) {
    timesBar.innerHTML = `
      <span><strong>${data.service.time}</strong> — ${data.service.location}</span>
      <span><strong>${data.service.onlineNote}</strong></span>`;
  }

  /* ── Homepage: Connect / Gather ── */
  if (data.connect) {
    set('[data-content="text-keyword"]',
      `Text ${data.connect.textKeyword} to ${data.connect.textNumber}`);
    set('[data-content="devotional-title"]', data.connect.devotionalTitle);
    set('[data-content="devotional-desc"]', data.connect.devotionalDescription);
  }

  /* ── Homepage: This Week ── */
  if (data.thisWeek) {
    const label = `LATEST: "${data.thisWeek.sermonTitle}" · ${data.thisWeek.series}, ${data.thisWeek.seriesWeek}`;
    set('.vid-label', label);

    // Embed YouTube if ID is provided
    const videoMain = $('.video-main');
    if (videoMain && data.thisWeek.youtubeEmbedId) {
      videoMain.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${data.thisWeek.youtubeEmbedId}"
          title="${data.thisWeek.sermonTitle}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>`;
    }

    // Clips
    const clipsContainer = $('.clips');
    if (clipsContainer && data.thisWeek.clips) {
      const clipHTML = data.thisWeek.clips.map(c => `
        <a class="clip" href="${c.url || '#'}">
          <div class="thumb">${c.duration}</div>
          <div>
            <strong>${c.title}</strong>
            <span>${c.label}</span>
          </div>
        </a>`).join('');

      const browseLink = data.thisWeek.youtubeChannelUrl || '#';
      clipsContainer.innerHTML = clipHTML + `
        <a class="clip" href="${browseLink}">
          <div class="thumb">ALL</div>
          <div>
            <strong>Browse every message</strong>
            <span>Full library on YouTube</span>
          </div>
        </a>`;
    }
  }

  /* ── Homepage: Invite ── */
  if (data.invite) {
    const smsLink = $('[data-invite="sms"]');
    if (smsLink) {
      smsLink.href = `sms:?&body=${encodeURIComponent(data.invite.smsBody)}`;
    }
  }

  /* ── Start Here: What to Expect ── */
  const expectGrid = $('.expect');
  if (expectGrid && data.startHere && data.startHere.expect) {
    expectGrid.innerHTML = data.startHere.expect.map(item => `
      <div class="fact">
        <div class="ic" aria-hidden="true">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </div>`).join('');
  }

  /* ── Start Here: FAQ ── */
  const faqContainer = $('.faq');
  if (faqContainer && data.startHere && data.startHere.faq) {
    faqContainer.innerHTML = data.startHere.faq.map(item => `
      <details>
        <summary>${item.question}</summary>
        <p class="answer">${item.answer}</p>
      </details>`).join('');
  }

  /* ── Next Steps: Rhythm groups ── */
  function renderSteps(containerSel, items) {
    const container = $(containerSel);
    if (!container || !items) return;
    container.innerHTML = items.map(s => `
      <a class="step" href="${s.linkUrl || '#'}">
        <div class="when">${s.when}</div>
        <h4>${s.title}</h4>
        <p>${s.body}</p>
        <span class="go">${s.linkText}</span>
      </a>`).join('');
  }

  if (data.nextSteps) {
    renderSteps('[data-steps="weekly"]', data.nextSteps.weekly);
    renderSteps('[data-steps="seasonal"]', data.nextSteps.seasonal);
    renderSteps('[data-steps="milestones"]', data.nextSteps.milestones);
  }

  /* ── Footer: contact & social (all pages) ── */
  if (data.contact) {
    set('[data-content="phone"]', data.contact.phone);
    set('[data-content="address"]', data.contact.address);
    const dirLink = $('[data-content="directions"]');
    if (dirLink) dirLink.href = data.contact.directionsUrl;
  }

  if (data.giving) {
    $$('[data-link="give"]').forEach(el => {
      if (data.giving.url) el.href = data.giving.url;
    });
  }

  if (data.social) {
    $$('[data-link="instagram"]').forEach(el => { if (data.social.instagram) el.href = data.social.instagram; });
    $$('[data-link="facebook"]').forEach(el => { if (data.social.facebook) el.href = data.social.facebook; });
    $$('[data-link="youtube"]').forEach(el => { if (data.social.youtube) el.href = data.social.youtube; });
  }
})();
