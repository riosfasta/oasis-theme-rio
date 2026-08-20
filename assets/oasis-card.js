/*
  THE OASIS — product card variant hover
  Hovering or focusing a variant thumbnail swaps the card's main image to that
  variant; leaving the card restores the product's featured image.

  Notes:
  - The thumbnails are real links to the variant URL, so clicking still works
    and the card stays usable without JavaScript.
  - Full-size variant images are prefetched once, on first hover of the card,
    so the swap doesn't flash on a slow connection — and costs nothing for
    visitors who never hover.
  - Touch devices have no hover: the first tap swaps, so a shopper still sees
    the variant before following the link.
*/
if (!customElements.get('oasis-card')) {
  customElements.define(
    'oasis-card',
    class OasisCard extends HTMLElement {
      connectedCallback() {
        this.image = this.querySelector('[data-main-image]');
        this.swatches = Array.from(this.querySelectorAll('[data-variant-src]'));
        if (!this.image || !this.swatches.length) return;

        this.base = {
          src: this.image.getAttribute('src'),
          srcset: this.image.getAttribute('srcset'),
        };
        this.prefetched = false;

        this.swatches.forEach((swatch) => {
          const show = () => this.show(swatch);
          swatch.addEventListener('mouseenter', show);
          swatch.addEventListener('focus', show);
          swatch.addEventListener('touchstart', show, { passive: true });
        });

        this.addEventListener('mouseenter', () => this.prefetch());
        this.addEventListener('mouseleave', () => this.reset());
        this.addEventListener('focusin', () => this.prefetch());
        this.addEventListener('focusout', (event) => {
          if (!this.contains(event.relatedTarget)) this.reset();
        });
      }

      prefetch() {
        if (this.prefetched) return;
        this.prefetched = true;
        this.swatches.forEach((swatch) => {
          const preload = new Image();
          if (swatch.dataset.variantSrcset) preload.srcset = swatch.dataset.variantSrcset;
          preload.src = swatch.dataset.variantSrc;
        });
      }

      show(swatch) {
        if (this.current === swatch) return;
        this.current = swatch;
        if (swatch.dataset.variantSrcset) {
          this.image.setAttribute('srcset', swatch.dataset.variantSrcset);
        } else {
          this.image.removeAttribute('srcset');
        }
        this.image.setAttribute('src', swatch.dataset.variantSrc);
        this.swatches.forEach((s) => s.removeAttribute('aria-current'));
        swatch.setAttribute('aria-current', 'true');
      }

      reset() {
        this.current = null;
        if (this.base.srcset) {
          this.image.setAttribute('srcset', this.base.srcset);
        } else {
          this.image.removeAttribute('srcset');
        }
        this.image.setAttribute('src', this.base.src);
        this.swatches.forEach((s) => s.removeAttribute('aria-current'));
      }
    }
  );
}
