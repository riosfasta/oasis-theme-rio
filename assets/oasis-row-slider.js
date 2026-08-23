/*
  THE OASIS — product row slider

  Pages a scroll-snap track by whole pages (one page = however many cards are
  visible), and keeps the arrows in sync with where the track actually is.

  Notes:
  - Scrolling is native, so touch swipe, trackpad, shift-wheel and keyboard all
    work without any code, and `scroll-behavior` in CSS honours reduced-motion.
  - Because it is native scroll, the track is still fully usable if this script
    never loads; only the arrows go missing.
  - Arrows are hidden entirely when everything already fits, so a row of four
    products doesn't get controls it doesn't need.
*/
if (!customElements.get('oasis-row-slider')) {
  customElements.define(
    'oasis-row-slider',
    class OasisRowSlider extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-track]');
        this.prev = this.querySelector('[data-prev]');
        this.next = this.querySelector('[data-next]');
        if (!this.track || !this.prev || !this.next) return;

        this.prev.addEventListener('click', () => this.page(-1));
        this.next.addEventListener('click', () => this.page(1));
        this.track.addEventListener('scroll', () => this.schedule(), { passive: true });

        // Centre the arrows on the product image rather than the whole card,
        // which includes the title, price and thumbnails and sits far lower.
        this.observer = new ResizeObserver(() => {
          this.measure();
          this.schedule();
        });
        this.observer.observe(this.track);

        this.measure();
        this.sync();
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
      }

      measure() {
        const media = this.track.querySelector('.oasis-card__media');
        if (media) {
          this.style.setProperty('--oasis-arrow-top', `${media.offsetHeight / 2}px`);
        }
      }

      schedule() {
        if (this.frame) cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.sync());
      }

      page(direction) {
        this.track.scrollBy({ left: this.track.clientWidth * direction, behavior: 'smooth' });
      }

      sync() {
        // A pixel of slack: fractional widths mean the ends rarely land exactly.
        const max = this.track.scrollWidth - this.track.clientWidth;
        const atStart = this.track.scrollLeft <= 1;
        const atEnd = this.track.scrollLeft >= max - 1;
        this.toggleAttribute('data-fits', max <= 1);
        this.prev.disabled = atStart;
        this.next.disabled = atEnd;
      }
    }
  );
}
