/*
  THE OASIS — price band filter

  Shopify's price filter is one range, so the bands are mutually exclusive:
  ticking one clears the others and writes its bounds into the two hidden
  gte/lte inputs. The visible boxes have no `name`, so they never reach the URL.

  Dawn's facet form listens for `input` on the form and submits after a debounce.
  This handler runs on the same event, before that debounce elapses, so by the
  time Dawn reads the form the hidden values are already correct.
*/
if (!customElements.get('oasis-price-bands')) {
  customElements.define(
    'oasis-price-bands',
    class OasisPriceBands extends HTMLElement {
      connectedCallback() {
        this.gte = this.querySelector('[data-gte]');
        this.lte = this.querySelector('[data-lte]');
        this.bands = Array.from(this.querySelectorAll('[data-band]'));
        if (!this.gte || !this.lte || !this.bands.length) return;

        this.bands.forEach((band) => {
          band.addEventListener('change', () => this.select(band));
        });
      }

      select(band) {
        // Re-ticking the active band clears the filter rather than doing nothing.
        const on = band.checked;

        this.bands.forEach((other) => {
          if (other !== band) other.checked = false;
          other.closest('.facets__label')?.classList.toggle('active', other === band && on);
        });

        this.gte.value = on ? band.dataset.min || '' : '';
        this.lte.value = on ? band.dataset.max || '' : '';
      }
    }
  );
}
