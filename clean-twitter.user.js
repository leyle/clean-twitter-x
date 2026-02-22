// ==UserScript==
// @name         Clean Twitter/X - Focus Mode
// @namespace    https://github.com/leyle/clean-twitter-x
// @version      1.6.0
// @description  Hide sidebars on Twitter/X and expand the main content for distraction-free reading.
// @author       Axel
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────
  const MAIN_MAX_WIDTH = '800px';
  const hideLeftSidebar = GM_getValue('hideLeftSidebar', true);

  // ── Settings Menu ──────────────────────────────────────────────────────
  function toggleLeftSidebar() {
    GM_setValue('hideLeftSidebar', !hideLeftSidebar);
    location.reload();
  }
  GM_registerMenuCommand(`${hideLeftSidebar ? 'Show' : 'Hide'} Left Sidebar on Feed`, toggleLeftSidebar);

  // ── Page-type helpers ──────────────────────────────────────────────────
  const DETAIL_CLASS = 'ct-detail-page';
  const FEED_CLASS = 'ct-feed-page';

  function isDetailPage() {
    return /\/status\/\d+/.test(location.pathname);
  }

  // ── CSS ────────────────────────────────────────────────────────────────
  let css = `
    /* ================================================================
       SHARED — applies on ALL pages (FEED + DETAIL)
       ================================================================ */

    /* Always hide the RIGHT sidebar */
    div[data-testid="sidebarColumn"] {
      display: none !important;
    }

    /* Cap the entire main structure to our desired width. */
    body[class*="ct-"] main[role="main"] {
      flex-grow: 0 !important;
      width: 100% !important;
      max-width: ${MAIN_MAX_WIDTH} !important;
    }

    /* Ensure the feed contents stretch to fully fill the capped main container */
    body[class*="ct-"] div[data-testid="primaryColumn"] {
      max-width: ${MAIN_MAX_WIDTH} !important;
      width: 100% !important;
      margin: 0 auto !important;
    }

    /* Uncap the internal 600px width limits on the timeline wrappers. 
       Twitter nests the feed in several divs; we let them expand to our 900px cap. */
    body[class*="ct-"] div[data-testid="primaryColumn"] > div,
    body[class*="ct-"] div[data-testid="primaryColumn"] > div > div,
    body[class*="ct-"] div[data-testid="primaryColumn"] > div > div > div,
    body[class*="ct-"] div[data-testid="primaryColumn"] > div > div > div > div {
      max-width: 100% !important;
    }

    /* ================================================================
       DETAIL PAGE ONLY (hide left sidebar too, for true focus mode)
       ================================================================ */
    body.${DETAIL_CLASS} header[role="banner"] {
      display: none !important;
    }
    
    /* On detail page, there is no left sidebar, so use standard margin centering */
    body.${DETAIL_CLASS} main[role="main"] {
      margin: 0 auto !important;
    }
  `;

  if (hideLeftSidebar) {
    css += `
      /* ================================================================
         FEED PAGE: Left Sidebar Hidden
         ================================================================ */
      body.${FEED_CLASS} header[role="banner"] {
        display: none !important;
      }
      body.${FEED_CLASS} main[role="main"] {
        margin: 0 auto !important;
      }
    `;
  } else {
    css += `
      /* ================================================================
         FEED PAGE: Left Sidebar Visible
         ================================================================ */
      /* Wrap header and main in a horizontally centered layout.
         We then apply a negative left margin on the wrapper to offset 
         the width of the left sidebar (~275px). Half of 275px is 137.5px.
         This drags the entire block leftward, placing the feed exactly in the center. */
      body.${FEED_CLASS} div:has(> header[role="banner"]):has(> main[role="main"]) {
        justify-content: center !important;
        margin-left: -137.5px !important;
      }

      /* Stop left sidebar from stretching to take empty space */
      body.${FEED_CLASS} header[role="banner"] {
        flex-grow: 0 !important;
        width: 275px !important; /* Lock the left sidebar to its typical max width */
      }
    `;
  }

  GM_addStyle(css);

  // ── JavaScript: widen parent chain ─────────────────────────────────────
  //  Since CSS sets the outer bounds, we just force the inner React wrappers
  //  to take up 100% width so primaryColumn can expand to the CSS cap.
  const MARKER_ATTR = 'data-ct-widened';

  function widenAncestors() {
    const primary = document.querySelector('div[data-testid="primaryColumn"]');
    const main = document.querySelector('main[role="main"]');
    const header = document.querySelector('header[role="banner"]');

    if (!primary || !main) return;

    const detail = isDetailPage();

    // Center the parent flex container (JS fallback for CSS :has) ONLY on feed pages with left sidebar visible
    if (!hideLeftSidebar && !detail && header && header.parentElement && header.parentElement.tagName === 'DIV') {
      if (!header.parentElement.getAttribute('data-ct-wrapper')) {
        header.parentElement.style.setProperty('justify-content', 'center', 'important');
        header.parentElement.style.setProperty('margin-left', '-137.5px', 'important');
        header.parentElement.setAttribute('data-ct-wrapper', '1');
      }
    }

    // Widen every wrapper from primaryColumn up to main
    let el = primary.parentElement;
    while (el && el !== main) {
      if (!el.getAttribute(MARKER_ATTR)) {
        el.style.setProperty('max-width', '100%', 'important');
        el.style.setProperty('width', '100%', 'important');
        el.setAttribute(MARKER_ATTR, '1');
      }
      el = el.parentElement;
    }

    // Force primaryColumn to grow to fill available space
    if (!primary.getAttribute(MARKER_ATTR)) {
      primary.style.setProperty('flex-grow', '1', 'important');
      primary.style.setProperty('flex-shrink', '0', 'important');
      primary.setAttribute(MARKER_ATTR, '1');
    }
  }

  function clearWidening() {
    document.querySelectorAll(`[${MARKER_ATTR}]`).forEach(el => {
      el.style.removeProperty('max-width');
      el.style.removeProperty('width');
      el.style.removeProperty('flex-grow');
      el.style.removeProperty('flex-shrink');
      el.removeAttribute(MARKER_ATTR);
    });
    const centered = document.querySelector('[data-ct-wrapper]');
    if (centered) {
      centered.style.removeProperty('justify-content');
      centered.style.removeProperty('margin-left');
      centered.removeAttribute('data-ct-wrapper');
    }
  }

  // ── Page class manager ─────────────────────────────────────────────────
  function applyPageClass() {
    if (!document.body) return;
    if (isDetailPage()) {
      document.body.classList.add(DETAIL_CLASS);
      document.body.classList.remove(FEED_CLASS);
    } else {
      document.body.classList.add(FEED_CLASS);
      document.body.classList.remove(DETAIL_CLASS);
    }
  }

  // ── Initialization ─────────────────────────────────────────────────────
  function onReady() {
    applyPageClass();
    widenAncestors();
  }

  function boot() {
    if (document.body) {
      onReady();
      observe();
    } else {
      const waitForBody = new MutationObserver(() => {
        if (document.body) {
          waitForBody.disconnect();
          onReady();
          observe();
        }
      });
      waitForBody.observe(document.documentElement, { childList: true });
    }
  }

  function observe() {
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Clear old inline styles before switching page type
        clearWidening();
        applyPageClass();
      }
      // Re-run for detail pages (primaryColumn may render late)
      widenAncestors();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  boot();
})();
