/**
 * Product Page Image Carousel
 * Handles arrow navigation on desktop and swipe on mobile with infinite loop
 */

class ProductCarousel extends HTMLElement {
  constructor() {
    super();
    this.slidesContainer = null;
    this.slideItems = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.dots = null;

    this.currentIndex = 0;
    this.totalSlides = 0;
    this.isInfinite = true;

    // Touch/swipe variables
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isDragging = false;
    this.startTranslate = 0;
    this.currentTranslate = 0;
    this.isTransitioning = false;

    // Store bound handlers for cleanup
    this.boundHandlers = {
      prevClick: null,
      nextClick: null,
      delegatedClick: null,
      dotClicks: [],
      touchStart: null,
      touchMove: null,
      touchEnd: null,
      mouseDown: null,
      mouseMove: null,
      mouseUp: null,
      mouseLeave: null,
      prevHover: null,
      nextHover: null
    };

    // Image preloading
    this.preloadedImages = new Set();
    this.preloadAdjacent = true;

    this.init();
  }

  preloadImage(imgElement) {
    if (!imgElement || this.preloadedImages.has(imgElement.src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imgElement.src;
    if (imgElement.srcset) {
      link.setAttribute('imagesrcset', imgElement.srcset);
    }
    document.head.appendChild(link);
    this.preloadedImages.add(imgElement.src);
  }

  preloadAdjacentSlides() {
    if (!this.preloadAdjacent || !this.slideItems || this.slideItems.length <= 1) return;

    // Preload next slide
    const nextIndex = this.isInfinite 
      ? (this.currentIndex + 1) % this.totalSlides 
      : Math.min(this.currentIndex + 1, this.totalSlides - 1);
    if (nextIndex !== this.currentIndex) {
      const nextSlide = this.slideItems[nextIndex];
      if (nextSlide) {
        const nextImg = nextSlide.querySelector('img');
        if (nextImg && nextImg.loading === 'lazy') {
          this.preloadImage(nextImg);
        }
      }
    }

    // Preload previous slide
    const prevIndex = this.isInfinite 
      ? (this.currentIndex - 1 + this.totalSlides) % this.totalSlides 
      : Math.max(this.currentIndex - 1, 0);
    if (prevIndex !== this.currentIndex) {
      const prevSlide = this.slideItems[prevIndex];
      if (prevSlide) {
        const prevImg = prevSlide.querySelector('img');
        if (prevImg && prevImg.loading === 'lazy') {
          this.preloadImage(prevImg);
        }
      }
    }
  }

  cleanup() {
    if (this.boundHandlers.delegatedClick) {
      this.removeEventListener('click', this.boundHandlers.delegatedClick);
    }
    if (this.prevBtn && this.boundHandlers.prevHover) {
      this.prevBtn.removeEventListener('mouseenter', this.boundHandlers.prevHover);
    }
    if (this.nextBtn && this.boundHandlers.nextHover) {
      this.nextBtn.removeEventListener('mouseenter', this.boundHandlers.nextHover);
    }
    if (this.dots && this.boundHandlers.dotClicks.length > 0) {
      this.dots.forEach((dot, index) => {
        if (this.boundHandlers.dotClicks[index]) {
          dot.removeEventListener('click', this.boundHandlers.dotClicks[index]);
        }
      });
    }
    if (this.slidesContainer) {
      if (this.boundHandlers.touchStart) {
        this.slidesContainer.removeEventListener('touchstart', this.boundHandlers.touchStart);
      }
      if (this.boundHandlers.touchMove) {
        this.slidesContainer.removeEventListener('touchmove', this.boundHandlers.touchMove);
      }
      if (this.boundHandlers.touchEnd) {
        this.slidesContainer.removeEventListener('touchend', this.boundHandlers.touchEnd);
      }
      if (this.boundHandlers.mouseDown) {
        this.slidesContainer.removeEventListener('mousedown', this.boundHandlers.mouseDown);
      }
      if (this.boundHandlers.mouseMove) {
        this.slidesContainer.removeEventListener('mousemove', this.boundHandlers.mouseMove);
      }
      if (this.boundHandlers.mouseUp) {
        this.slidesContainer.removeEventListener('mouseup', this.boundHandlers.mouseUp);
      }
      if (this.boundHandlers.mouseLeave) {
        this.slidesContainer.removeEventListener('mouseleave', this.boundHandlers.mouseLeave);
      }
    }
    // Clear handlers array
    this.boundHandlers.dotClicks = [];
  }

  init() {
    this.cleanup();

    this.slidesContainer = this.querySelector('.product-carousel__slides') || 
                          this.querySelector('.product__media-list');
    this.slideItems = this.querySelectorAll('.product-carousel__slide');
    this.prevBtn = this.querySelector('.product-carousel__nav--prev');
    this.nextBtn = this.querySelector('.product-carousel__nav--next');
    this.dots = this.querySelectorAll('.product-carousel__dot');

    if (this.slideItems.length === 0 && this.slidesContainer) {
      this.slideItems = this.slidesContainer.querySelectorAll('li.product__media-item');
    }

    this.totalSlides = this.slideItems.length;

    // Reset current index if it's out of bounds
    if (this.currentIndex >= this.totalSlides) {
      this.currentIndex = 0;
    }

    if (this.totalSlides <= 1) {
      if (this.prevBtn) this.prevBtn.style.display = 'none';
      if (this.nextBtn) this.nextBtn.style.display = 'none';
      if (this.dots.length > 0) {
        const dotsContainer = this.querySelector('.product-carousel__dots');
        if (dotsContainer) dotsContainer.style.display = 'none';
      }
      return;
    }

    if (this.prevBtn) this.prevBtn.style.display = '';
    if (this.nextBtn) this.nextBtn.style.display = '';
    const dotsContainer = this.querySelector('.product-carousel__dots');
    if (dotsContainer) dotsContainer.style.display = '';

    this.setActiveSlide(this.currentIndex);

    this.boundHandlers.delegatedClick = (e) => {
      const target = e.target.closest('.product-carousel__nav--prev, .product-carousel__nav--next');
      
      if (!target) {
        return;
      }
      
      if (target.classList.contains('product-carousel__nav--prev')) {
        e.preventDefault();
        e.stopPropagation();
        this.prev();
      } else if (target.classList.contains('product-carousel__nav--next')) {
        e.preventDefault();
        e.stopPropagation();
        this.next();
      }
    };
    
    this.addEventListener('click', this.boundHandlers.delegatedClick, { capture: false, passive: false });
    
    if (this.prevBtn) {
      this.boundHandlers.prevHover = () => {
        const prevIndex = this.isInfinite 
          ? (this.currentIndex - 1 + this.totalSlides) % this.totalSlides 
          : Math.max(this.currentIndex - 1, 0);
        if (prevIndex !== this.currentIndex && this.slideItems[prevIndex]) {
          const prevImg = this.slideItems[prevIndex].querySelector('img');
          if (prevImg) this.preloadImage(prevImg);
        }
      };
      this.prevBtn.addEventListener('mouseenter', this.boundHandlers.prevHover);
    }
    
    if (this.nextBtn) {
      this.boundHandlers.nextHover = () => {
        const nextIndex = this.isInfinite 
          ? (this.currentIndex + 1) % this.totalSlides 
          : Math.min(this.currentIndex + 1, this.totalSlides - 1);
        if (nextIndex !== this.currentIndex && this.slideItems[nextIndex]) {
          const nextImg = this.slideItems[nextIndex].querySelector('img');
          if (nextImg) this.preloadImage(nextImg);
        }
      };
      this.nextBtn.addEventListener('mouseenter', this.boundHandlers.nextHover);
    }

    // Dot navigation - bind and store handlers
    this.dots.forEach((dot, index) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goToSlide(index);
      };
      this.boundHandlers.dotClicks[index] = handler;
      dot.addEventListener('click', handler);
    });

    // Touch events for mobile swipe - bind and store handlers
    if (this.slidesContainer) {
      this.boundHandlers.touchStart = this.handleTouchStart.bind(this);
      this.boundHandlers.touchMove = this.handleTouchMove.bind(this);
      this.boundHandlers.touchEnd = this.handleTouchEnd.bind(this);
      this.boundHandlers.mouseDown = this.handleMouseDown.bind(this);
      this.boundHandlers.mouseMove = this.handleMouseMove.bind(this);
      this.boundHandlers.mouseUp = this.handleMouseUp.bind(this);
      this.boundHandlers.mouseLeave = this.handleMouseUp.bind(this);

      this.slidesContainer.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: true });
      this.slidesContainer.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
      this.slidesContainer.addEventListener('touchend', this.boundHandlers.touchEnd);
      this.slidesContainer.addEventListener('mousedown', this.boundHandlers.mouseDown);
      this.slidesContainer.addEventListener('mousemove', this.boundHandlers.mouseMove);
      this.slidesContainer.addEventListener('mouseup', this.boundHandlers.mouseUp);
      this.slidesContainer.addEventListener('mouseleave', this.boundHandlers.mouseLeave);
    }

    this.updateButtons();
  }

  reinitialize() {
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.isDragging = false;
    this.init();
  }

  setActiveSlide(index) {
    this.slidesContainer = this.querySelector('.product-carousel__slides') || 
                          this.querySelector('.product__media-list');
    
    if (!this.slidesContainer) {
      return;
    }

    this.slideItems = this.querySelectorAll('.product-carousel__slide');
    if (this.slideItems.length === 0 && this.slidesContainer) {
      this.slideItems = this.slidesContainer.querySelectorAll('li.product__media-item');
    }
    
    if (index < 0 || index >= this.slideItems.length) {
      return;
    }

    const transform = `translateX(-${index * 100}%)`;
    this.slidesContainer.style.transform = transform;

    // Remove active class from all slides
    this.slideItems.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    // Refresh dots reference and update
    this.dots = this.querySelectorAll('.product-carousel__dot');
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });

    this.currentIndex = index;
    this.totalSlides = this.slideItems.length;

    if (this.preloadAdjacent) {
      requestAnimationFrame(() => {
        this.preloadAdjacentSlides();
      });
    }
  }

  prev() {
    if (this.isTransitioning) {
      return;
    }

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
    if (this.isTransitioning) {
      return;
    }

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

    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      // Update position during drag
      this.slidesContainer.style.transition = 'none';
      this.slidesContainer.style.transform = `translateX(${translate}%)`;
    });

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

    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      this.slidesContainer.style.transition = 'none';
      this.slidesContainer.style.transform = `translateX(${this.currentTranslate}px)`;
    });
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

