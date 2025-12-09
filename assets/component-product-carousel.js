/**
 * Product Page Image Carousel
 * Handles arrow navigation on desktop and swipe on mobile with infinite loop
 */

class ProductCarousel extends HTMLElement {
  constructor() {
    super();
    this.slidesContainer = this.querySelector('.product-carousel__slides');
    this.slideItems = this.querySelectorAll('.product-carousel__slide');
    this.prevBtn = this.querySelector('.product-carousel__nav--prev');
    this.nextBtn = this.querySelector('.product-carousel__nav--next');
    this.dots = this.querySelectorAll('.product-carousel__dot');

    this.currentIndex = 0;
    this.totalSlides = this.slideItems.length;
    this.isInfinite = true;

    // Touch/swipe variables
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isDragging = false;
    this.startTranslate = 0;
    this.currentTranslate = 0;
    this.isTransitioning = false;

    this.init();
  }

  init() {
    if (this.totalSlides <= 1) {
      // Hide navigation if only one slide
      if (this.prevBtn) this.prevBtn.style.display = 'none';
      if (this.nextBtn) this.nextBtn.style.display = 'none';
      if (this.dots.length > 0) {
        const dotsContainer = this.querySelector('.product-carousel__dots');
        if (dotsContainer) dotsContainer.style.display = 'none';
      }
      return;
    }

    // Set initial active slide
    this.setActiveSlide(this.currentIndex);

    // Arrow navigation
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.prev();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.next();
      });
    }

    // Dot navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goToSlide(index);
      });
    });

    // Touch events for mobile swipe
    if (this.slidesContainer) {
      this.slidesContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      this.slidesContainer.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      this.slidesContainer.addEventListener('touchend', this.handleTouchEnd.bind(this));

      // Mouse events for desktop drag (optional on small screens)
      this.slidesContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.slidesContainer.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.slidesContainer.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.slidesContainer.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    this.updateButtons();
  }

  setActiveSlide(index) {
    if (!this.slidesContainer) return;

    // Update transform for sliding effect
    this.slidesContainer.style.transform = `translateX(-${index * 100}%)`;

    // Remove active class from all slides
    this.slideItems.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    // Update dots
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });

    this.currentIndex = index;
  }

  prev() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentIndex--;

    if (this.isInfinite && this.currentIndex < 0) {
      this.currentIndex = this.totalSlides - 1;
    } else if (this.currentIndex < 0) {
      this.currentIndex = 0;
      this.isTransitioning = false;
      return;
    }

    this.setActiveSlide(this.currentIndex);
    this.updateButtons();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  next() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentIndex++;

    if (this.isInfinite && this.currentIndex >= this.totalSlides) {
      this.currentIndex = 0;
    } else if (this.currentIndex >= this.totalSlides) {
      this.currentIndex = this.totalSlides - 1;
      this.isTransitioning = false;
      return;
    }

    this.setActiveSlide(this.currentIndex);
    this.updateButtons();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  goToSlide(index) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.currentIndex = Math.max(0, Math.min(index, this.totalSlides - 1));
    this.setActiveSlide(this.currentIndex);
    this.updateButtons();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  updateButtons() {
    // For infinite carousel, buttons are always enabled
    if (this.isInfinite) {
      if (this.prevBtn) this.prevBtn.disabled = false;
      if (this.nextBtn) this.nextBtn.disabled = false;
    } else {
      if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
      if (this.nextBtn) this.nextBtn.disabled = this.currentIndex === this.totalSlides - 1;
    }
  }

  // Touch handlers
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.isDragging = true;
    this.classList.add('is-touching');
  }

  handleTouchMove(e) {
    if (!this.isDragging || !this.slidesContainer) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - this.touchStartX;
    const baseTranslate = -this.currentIndex * 100;
    const translate = baseTranslate + (diff / this.slidesContainer.offsetWidth) * 100;

    // Update position during drag
    this.slidesContainer.style.transition = 'none';
    this.slidesContainer.style.transform = `translateX(${translate}%)`;

    // Prevent vertical scroll when swiping horizontally
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (!this.isDragging || !this.slidesContainer) return;

    this.isDragging = false;
    this.classList.remove('is-touching');
    this.slidesContainer.style.transition = '';

    const touchEndX = e.changedTouches[0].clientX;
    const movedBy = touchEndX - this.touchStartX;
    const threshold = this.slidesContainer.offsetWidth * 0.2; // 20% of container width

    if (Math.abs(movedBy) > threshold) {
      if (movedBy < 0) {
        this.next();
      } else {
        this.prev();
      }
    } else {
      // Snap back to current slide
      this.setActiveSlide(this.currentIndex);
    }
  }

  // Mouse handlers (for desktop drag support on smaller screens)
  handleMouseDown(e) {
    if (window.innerWidth > 749 || !this.slidesContainer) return;

    this.touchStartX = e.clientX;
    this.isDragging = true;
    this.startTranslate = -this.currentIndex * this.slidesContainer.offsetWidth;
    e.preventDefault();
  }

  handleMouseMove(e) {
    if (!this.isDragging || window.innerWidth > 749 || !this.slidesContainer) return;

    const currentX = e.clientX;
    const diff = currentX - this.touchStartX;
    this.currentTranslate = this.startTranslate + diff;

    this.slidesContainer.style.transition = 'none';
    this.slidesContainer.style.transform = `translateX(${this.currentTranslate}px)`;
  }

  handleMouseUp() {
    if (!this.isDragging || window.innerWidth > 749 || !this.slidesContainer) return;

    this.isDragging = false;
    this.slidesContainer.style.transition = '';

    const movedBy = this.currentTranslate - this.startTranslate;
    const threshold = this.slidesContainer.offsetWidth * 0.2;

    if (Math.abs(movedBy) > threshold) {
      if (movedBy < 0) {
        this.next();
      } else {
        this.prev();
      }
    } else {
      this.setActiveSlide(this.currentIndex);
    }
  }
}

customElements.define('product-carousel', ProductCarousel);

