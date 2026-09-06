/*
  THE OASIS — load more

  Turns the "Load more" link rendered by snippets/oasis-load-more.liquid into an
  in-place append. The link points at the real ?page=N URL, so if this script
  never runs — or the fetch fails — clicking it still walks the collection page
  by page. That is the whole reason it is an <a> and not a <button>.
*/
if (!customElements.get('oasis-load-more')) {
  customElements.define(
    'oasis-load-more',
    class OasisLoadMore extends HTMLElement {
      connectedCallback() {
        this.gridSelector = this.dataset.grid;
        this.itemSelector = this.dataset.item;
        this.button = this.querySelector('[data-more]');
        this.counter = this.querySelector('[data-count]');
        this.grid = this.gridSelector ? document.querySelector(this.gridSelector) : null;
        if (!this.grid || !this.itemSelector) return;

        if (this.button) {
          this.button.addEventListener('click', (event) => {
            // Let a modified click open the next page in a tab, as a link should.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            this.load();
          });
        }

        this.updateCount();
      }

      get childSelector() {
        return `:scope > ${this.itemSelector}`;
      }

      async load() {
        if (this.hasAttribute('data-exhausted')) return;
        const url = this.button && this.button.getAttribute('href');
        if (!url || this.loading) return;

        this.loading = true;
        this.setAttribute('data-loading', '');
        this.button.setAttribute('aria-busy', 'true');

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Request failed: ${response.status}`);

          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          const nextGrid = doc.querySelector(this.gridSelector);
          const items = nextGrid ? nextGrid.querySelectorAll(this.childSelector) : [];
          if (!items.length) {
            this.exhaust();
            return;
          }

          const firstNewIndex = this.grid.querySelectorAll(this.childSelector).length;
          items.forEach((item) => {
            /*
              Dawn's reveal-on-scroll only fires for elements that cross into the
              viewport after they are observed. These land already in view on a
              short page, so they would stay at opacity 0 forever. Drop the hook
              and let them appear.
            */
            item.classList.remove('scroll-trigger', 'animate--slide-in');
            item.removeAttribute('data-cascade');
            item.style.removeProperty('--animation-order');
            this.grid.appendChild(document.importNode(item, true));
          });

          /*
            The fetched page carries its own button, whose href is page N+1.
            Match it by grid selector rather than taking the first
            <oasis-load-more> in the document: a template with two paginated
            grids would otherwise hand this one the other grid's href.

            A href equal to the one just fetched means the pagination is not
            advancing, and following it would append the same page again — the
            signature behind a report of "showing 90 of 69" on a 24-per-page
            collection of 69 (24 + 24 + 21 + 21). Treat it as the end.
          */
          const nextLoadMore = Array.from(doc.querySelectorAll('oasis-load-more')).find(
            (el) => el.dataset.grid === this.gridSelector
          );
          const nextMore = nextLoadMore && nextLoadMore.querySelector('[data-more]');
          const nextHref = nextMore && nextMore.getAttribute('href');

          if (nextHref && nextHref !== url) {
            this.button.setAttribute('href', nextHref);
          } else {
            this.exhaust();
          }

          /*
            Keep the address bar on the page the reader is actually looking at.
            Without this, clicking a product from the third batch and pressing
            back drops them at page 1 with everything they had loaded gone.
          */
          window.history.replaceState({}, '', url);

          this.updateCount();
          this.focusFirstNew(firstNewIndex);
        } catch (error) {
          // A dead button is worse than a page load. Fall back to the real link.
          window.location.href = url;
        } finally {
          this.loading = false;
          this.removeAttribute('data-loading');
          if (this.button) this.button.removeAttribute('aria-busy');
        }
      }

      exhaust() {
        this.setAttribute('data-exhausted', '');
        if (!this.button) return;

        this.button.hidden = true;
        /*
          `hidden` alone is not enough to make it unclickable — it is a
          user-agent rule that any author `display` beats, and .oasis-btn sets
          one (see the [hidden] rule in oasis.css). An <a> cannot be disabled
          either. With no next page the href means nothing, so drop it: that
          takes the element out of the tab order and makes a click inert even if
          a stylesheet ever wins over [hidden] again.
        */
        this.button.removeAttribute('href');
        this.button.setAttribute('aria-hidden', 'true');
        this.button.setAttribute('tabindex', '-1');
      }

      updateCount() {
        /*
          Landing straight on ?page=3 — from the no-JS link, or from a refresh
          after replaceState — means the grid holds only that page's cards. The
          offset the server rendered is what makes the tally read 36 of 48
          rather than 12 of 48.
        */
        const offset = Number(this.dataset.offset) || 0;
        const inGrid = this.grid.querySelectorAll(this.childSelector).length;
        const total = Number(this.dataset.total);
        const hasTotal = Number.isFinite(total) && total > 0;

        // raw can exceed the total if a page was ever appended twice; the
        // displayed figure is clamped so it can never read more than exists.
        const raw = offset + inGrid;
        const shown = hasTotal ? Math.min(raw, total) : raw;

        if (this.counter && this.counter.dataset.template) {
          this.counter.textContent = this.counter.dataset.template
            .replace('[shown]', shown)
            .replace('[total]', hasTotal ? total : shown);
        }

        const fill = this.querySelector('[data-fill]');
        if (fill) fill.style.width = `${hasTotal ? Math.min(100, (shown / total) * 100) : 100}%`;

        /*
          The totals decide when to stop — not the fetched markup. Exhaustion
          used to be inferred only from whether the fetched page rendered a
          button, with nothing cross-checking it, so any state where that href
          kept advancing left the button up and the tally climbing past the
          total. Deriving it from the counts makes that impossible whatever the
          markup says.
        */
        if (hasTotal && raw >= total) this.exhaust();
      }

      /*
        Move focus to the first card of the new batch so a keyboard reader
        carries on from where the list grew, rather than from the button. Scroll
        is left alone: the button stays put under the reader's cursor, which is
        the point of load-more over pagination.
      */
      focusFirstNew(index) {
        const target = this.grid.querySelectorAll(this.childSelector)[index];
        if (!target) return;
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  );
}
