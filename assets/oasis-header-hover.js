/*
  THE OASIS — open the header dropdowns on hover

  Dawn's desktop dropdowns are <details> elements, so they only open on click.
  Shoppers expect a nav dropdown to open on hover, which is what this adds.

  Notes:
  - Click still works, and so does the keyboard: the panel is only closed again
    once focus has actually left it, so tabbing through the links can't shut it.
  - Delegated from the document rather than bound per element, so dropdowns added
    by a theme-editor re-render need no rebinding.
  - Desktop with a real pointer only. On touch there is no hover, and the mobile
    drawer is a different control entirely.
*/
(() => {
  const DESKTOP = '(hover: hover) and (min-width: 990px)';
  const CLOSE_DELAY = 120; // ms — covers the gap between summary and panel
  let timer;

  const panelOf = (menu) => menu.querySelector('details');

  const setOpen = (menu, open) => {
    const details = panelOf(menu);
    if (!details || details.open === open) return;
    details.open = open;
    const summary = details.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const closeOthers = (keep) => {
    document.querySelectorAll('header-menu').forEach((m) => {
      if (m !== keep) setOpen(m, false);
    });
  };

  document.addEventListener('mouseover', (event) => {
    if (!window.matchMedia(DESKTOP).matches) return;
    const menu = event.target.closest?.('header-menu');
    if (!menu) return;
    clearTimeout(timer);
    closeOthers(menu);
    setOpen(menu, true);
  });

  document.addEventListener('mouseout', (event) => {
    if (!window.matchMedia(DESKTOP).matches) return;
    const menu = event.target.closest?.('header-menu');
    if (!menu) return;
    // Ignore moves that stay inside the same menu (summary -> panel -> link).
    if (menu.contains(event.relatedTarget)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const details = panelOf(menu);
      if (details && details.contains(document.activeElement)) return;
      setOpen(menu, false);
    }, CLOSE_DELAY);
  });
})();
