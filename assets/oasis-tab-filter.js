/*
  THE OASIS — category tabs that filter in place

  Dawn already swaps the product grid without a page load: FacetFiltersForm
  fetches the section through the Section Rendering API and replaces
  #ProductGridContainer and #ProductCount. This hands the category tabs to that
  same machinery, so a tab behaves like a checkbox in the filter panel rather
  than like a link to another page.

  The tabs stay real <a href> elements. A middle-click still opens the filtered
  collection in a new tab, and with JavaScript off they simply load the page —
  which is why the click is intercepted here rather than the markup being
  rendered as buttons.

  Dawn's renderFilters() only replaces elements matching .js-filter, and this
  nav is not one, so it survives a filter render and has to keep its own active
  state in step with the URL.
*/
if (!customElements.get('oasis-tab-filter')) {
  customElements.define(
    'oasis-tab-filter',
    class OasisTabFilter extends HTMLElement {
      connectedCallback() {
        this.links = Array.from(this.querySelectorAll('.oasis-tabs__link[data-oasis-filter]'));
        if (!this.links.length) return;

        this.sync = this.sync.bind(this);
        this.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('popstate', this.sync);
        this.sync();
      }

      disconnectedCallback() {
        window.removeEventListener('popstate', this.sync);
      }

      /*
        facets.js declares `class FacetFiltersForm` at the top level of a classic
        script, which makes it a global lexical binding rather than a property of
        window — so it has to be reached by bare name, and only exists on pages
        that actually load facets.js.
      */
      get facets() {
        try {
          return FacetFiltersForm;
        } catch (error) {
          return null;
        }
      }

      onClick(event) {
        const link = event.target.closest('.oasis-tabs__link[data-oasis-filter]');
        if (!link) return;
        // Let a modified click open the filtered collection in a tab, as a link should.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

        const facets = this.facets;
        if (!facets || !document.getElementById('product-grid')) return;
        if (!document.getElementById('ProductGridContainer')) return;

        const url = new URL(link.href, window.location.origin);
        // A tab pointing at a different collection is a real navigation.
        if (url.pathname !== window.location.pathname) return;

        event.preventDefault();
        // renderPage pushes the new URL itself, so sync() reads the state we just moved to.
        facets.renderPage(url.searchParams.toString(), null, true);
        this.sync();
      }

      sync() {
        const search = new URLSearchParams(window.location.search);
        // The "show everything" tab is the one that is on when nothing is filtering.
        const anyFilter = Array.from(search.keys()).some((key) => key.startsWith('filter.'));

        this.links.forEach((link) => {
          const query = link.dataset.oasisFilter || '';
          let on;
          if (!query) {
            on = !anyFilter;
          } else {
            const wanted = new URLSearchParams(query);
            on = Array.from(wanted.entries()).every(([key, value]) => search.getAll(key).includes(value));
          }
          link.classList.toggle('oasis-tabs__link--active', on);
          if (on) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }
    }
  );
}
