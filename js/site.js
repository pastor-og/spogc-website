/* ═══════════════════════════════════════════════
   SPOGC — Site JavaScript
   Seasonal logic, share infrastructure, content
   ═══════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ── Seasonal worship logic ── */
  function updateSeason() {
    var now = new Date();
    var year = now.getFullYear();
    
    // Beach Church: Memorial Day (last Monday in May) through Sunday after Labor Day
    // Simplified: June 1 through September 15 (covers the range)
    var month = now.getMonth(); // 0-indexed
    var isSummer = (month >= 4 && now.getDate() >= 20) || (month >= 5 && month <= 7) || (month === 8 && now.getDate() <= 15);
    
    var titleEl = document.getElementById('service-title');
    var locEl = document.getElementById('service-location');
    
    if (titleEl && locEl) {
      if (isSummer) {
        titleEl.textContent = 'Beach Church · Sunday 9am';
        locEl.textContent = 'Boardwalk Pavilion, Ocean Grove';
      } else {
        titleEl.textContent = 'Contemporary Worship · Sunday';
        locEl.textContent = "St. Paul's, 80 Embury Ave";
      }
    }
  }

  /* ── Share infrastructure ── */
  var shareMessages = {
    start: {
      text: "Hey — check out St. Paul's Ocean Grove Church. They have Alpha, recovery groups, and prayer. Worth a look.",
      url: 'https://oceangrove.church/#start'
    },
    belong: {
      text: "There's a group for everyone at St. Paul's Ocean Grove — small groups, kids programs, IDD ministry. Check it out.",
      url: 'https://oceangrove.church/#belong'
    },
    neighborhood: {
      text: "St. Paul's Ocean Grove Church does block parties, National Night Out, and community events. They're in the neighborhood.",
      url: 'https://oceangrove.church/#neighborhood'
    },
    jesus: {
      text: "I wanted you to see this — it's about Jesus and it meant something to me.",
      url: 'https://oceangrove.church/jesus'
    },
    invite: {
      text: "Hey — come to Beach Church with me Sunday? 9 AM at the Ocean Grove boardwalk pavilion. I'll save you a seat. oceangrove.church",
      url: 'https://oceangrove.church'
    }
  };

  function handleSMSShare(key) {
    var msg = shareMessages[key];
    if (msg) {
      var smsUrl = 'sms:?&body=' + encodeURIComponent(msg.text + ' ' + msg.url);
      window.location.href = smsUrl;
    }
  }

  function handleNativeShare(key) {
    var msg = shareMessages[key];
    if (msg && navigator.share) {
      navigator.share({
        title: "St. Paul's Ocean Grove Church",
        text: msg.text,
        url: msg.url
      }).catch(function() {});
    } else {
      // Fallback to SMS if Web Share API not available
      handleSMSShare(key);
    }
  }

  function initShareButtons() {
    document.addEventListener('click', function(e) {
      var smsBtn = e.target.closest('[data-share]');
      var nativeBtn = e.target.closest('[data-share-native]');
      
      if (smsBtn) {
        e.preventDefault();
        handleSMSShare(smsBtn.getAttribute('data-share'));
      }
      if (nativeBtn) {
        e.preventDefault();
        handleNativeShare(nativeBtn.getAttribute('data-share-native'));
      }
    });
  }

  /* ── Mobile nav toggle ── */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function() {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        links.classList.toggle('nav-open');
      });
    }
  }

  /* ── Content loading from content.json ── */
  function loadContent() {
    fetch('/content.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        // Update sermon section
        if (data.thisWeek) {
          var label = document.getElementById('vid-label');
          if (label && data.thisWeek.sermonTitle) {
            var text = 'LATEST: "' + data.thisWeek.sermonTitle + '"';
            if (data.thisWeek.series) text += ' · ' + data.thisWeek.series;
            label.textContent = text;
          }
        }
        // Update social links
        if (data.social) {
          document.querySelectorAll('[data-link]').forEach(function(el) {
            var key = el.getAttribute('data-link');
            if (data.social[key]) el.href = data.social[key];
          });
        }
      })
      .catch(function() {
        // Content loads from static HTML as fallback
      });
  }

  /* ── Initialize ── */
  document.addEventListener('DOMContentLoaded', function() {
    updateSeason();
    initShareButtons();
    initNav();
    loadContent();
  });

})();
