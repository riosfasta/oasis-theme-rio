/*
  THE OASIS — SEOAnt trust badge placement

  Not our markup. The SEOAnt Trust Badges app appends its panel inside
  <product-form>, i.e. straight under the buy buttons, and lays it out as
  heading + logo, then URL + badges.

  We want it at the bottom of the product information, badges first, and the
  Freedom Business Alliance credit as a footer-style lockup — logo on the left,
  text on the right.

  Why JavaScript and not CSS: `order` only applies to flex items, and the panel
  is nested two levels inside a block container, so no amount of ordering moves
  it out of <product-form>. The DOM has to change. The rest — the column order
  and the lockup — is CSS; this file only relocates the panel and gathers the
  two headings into one text block so the lockup has something to sit beside.

  The app renders asynchronously and can re-render, so this watches rather than
  running once, and marks what it has done so repeat passes are free.
*/
(() => {
  const PANEL = '[class^="trust-badge-"], .giraffly-trust-badge > div';
  const INFO = '.product__info-container';

  const arrange = () => {
    const info = document.querySelector(INFO);
    if (!info) return false; // not a product page

    const panel = document.querySelector(PANEL);
    if (!panel) return false;
    if (panel.dataset.oasisPlaced === '1' && panel.parentElement === info) return true;

    // 1. Move it to the bottom of the product information.
    info.appendChild(panel);

    /*
      2. Swap the app's alliance credit for the theme's own lockup — the same
         one the footer shows. The app renders it as a sentence-case heading, a
         low-resolution logo from its CDN and a bare URL on three wrapped lines;
         the brand mark is "MEMBER OF THE / FREEDOM BUSINESS ALLIANCE" beside
         the mark. That is content, not styling, so no amount of CSS gets there.

         The markup comes from snippets/oasis-fba-lockup.liquid via a <template>,
         so the wording and the asset stay in Liquid.
    */
    const credit = panel.querySelector('.giraffly-right-Bar-Preview-width-credit');
    const lockup = document.getElementById('OasisFbaLockup');
    if (credit && lockup && !credit.querySelector('.oasis-fba')) {
      credit.replaceChildren(lockup.content.cloneNode(true));
    }

    panel.dataset.oasisPlaced = '1';
    return true;
  };

  const start = () => {
    if (!document.querySelector(INFO)) return; // nothing to do off product pages
    arrange();

    /*
      Keep watching: the panel arrives after this script runs, and the app may
      replace it later. arrange() short-circuits once the panel is in place, so
      the observer costs nothing in the steady state.
    */
    const observer = new MutationObserver(() => arrange());
    observer.observe(document.body, { childList: true, subtree: true });

    // The app is not going to inject an hour from now; stop watching eventually.
    setTimeout(() => observer.disconnect(), 30000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
