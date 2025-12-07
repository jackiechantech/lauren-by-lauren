/**
 * Card Image Carousel
 * Handles arrow navigation on desktop and swipe on mobile with infinite loop
 */

class CardCarousel extends HTMLElement {
  constructor() {
    super();
    this.slides = this.querySelector('.card__media-slides');
    this.slideItems = this.querySelectorAll('.card__media-slide');
    this.prevBtn = this.querySelector('.card__carousel-nav--prev');
    this.nextBtn = this.querySelector('.card__carousel-nav--next');
    this.dots = this.querySelectorAll('.card__carousel-dot');
    
    this.currentIndex = 0;
    this.totalSlides = this.slideItems.length;
    this.isInfinite = true; // Enable infinite scrolling
    
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
    if (this.totalSlides <= 1) return;
    
    this.productUrl = this.dataset.productUrl;
    
    // Prevent all clicks on buttons and dots from propagating
    const stopPropagation = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };
    
    // Arrow navigation
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        stopPropagation(e);
        this.prev();
      }, { capture: true });
      
      this.prevBtn.addEventListener('mousedown', stopPropagation, { capture: true });
      this.prevBtn.addEventListener('mouseup', stopPropagation, { capture: true });
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        stopPropagation(e);
        this.next();
      }, { capture: true });
      
      this.nextBtn.addEventListener('mousedown', stopPropagation, { capture: true });
      this.nextBtn.addEventListener('mouseup', stopPropagation, { capture: true });
    }
    
    // Dot navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        stopPropagation(e);
        this.goToSlide(index);
      }, { capture: true });
      
      dot.addEventListener('mousedown', stopPropagation, { capture: true });
      dot.addEventListener('mouseup', stopPropagation, { capture: true });
    });
    
    // Click on image area navigates to product (only if not dragging)
    this.slides.addEventListener('click', (e) => {
      if (this.hasInteracted || this.isDragging) {
        e.preventDefault();
        e.stopPropagation();
        this.hasInteracted = false;
        return;
      }
      if (this.productUrl) {
        window.location.href = this.productUrl;
      }
    });
    
    // Touch events for mobile swipe
    this.slides.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.slides.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.slides.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Mouse events for desktop drag (optional on small screens)
    this.slides.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.slides.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.slides.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.slides.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    // Listen for transition end to handle infinite loop
    this.slides.addEventListener('transitionend', this.handleTransitionEnd.bind(this));
    
    this.hasInteracted = false;
    this.updateButtons();
  }
  
  prev() {
    if (this.isTransitioning) return;
    
    this.hasInteracted = true;
    this.isTransitioning = true;
    this.currentIndex--;
    
    if (this.isInfinite && this.currentIndex < 0) {
      // Jump to last slide
      this.currentIndex = this.totalSlides - 1;
    } else if (this.currentIndex < 0) {
      this.currentIndex = 0;
      this.isTransitioning = false;
      return;
    }
    
    this.updateSlidePosition();
    this.updateButtons();
    this.updateDots();
    
    // Ensure transition completes
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }
  
  next() {
    if (this.isTransitioning) return;
    
    this.hasInteracted = true;
    this.isTransitioning = true;
    this.currentIndex++;
    
    if (this.isInfinite && this.currentIndex >= this.totalSlides) {
      // Jump to first slide
      this.currentIndex = 0;
    } else if (this.currentIndex >= this.totalSlides) {
      this.currentIndex = this.totalSlides - 1;
      this.isTransitioning = false;
      return;
    }
    
    this.updateSlidePosition();
    this.updateButtons();
    this.updateDots();
    
    // Ensure transition completes
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }
  
  goToSlide(index) {
    if (this.isTransitioning) return;
    
    this.hasInteracted = true;
    this.isTransitioning = true;
    this.currentIndex = Math.max(0, Math.min(index, this.totalSlides - 1));
    this.updateSlidePosition();
    this.updateButtons();
    this.updateDots();
  }
  
  updateSlidePosition(translate = null) {
    if (translate !== null) {
      this.slides.style.transform = `translateX(${translate}px)`;
    } else {
      this.slides.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }
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
  
  updateDots() {
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === this.currentIndex);
    });
  }
  
  handleTransitionEnd() {
    this.isTransitioning = false;
  }
  
  // Touch handlers
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.isDragging = true;
    this.startTranslate = -this.currentIndex * this.slides.offsetWidth;
    this.slides.style.transition = 'none';
    this.classList.add('is-touching');
  }
  
  handleTouchMove(e) {
    if (!this.isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - this.touchStartX;
    this.currentTranslate = this.startTranslate + diff;
    
    // For infinite carousel, allow dragging beyond edges
    if (this.isInfinite) {
      this.updateSlidePosition(this.currentTranslate);
    } else {
      // Limit dragging at edges for non-infinite
      const maxTranslate = 0;
      const minTranslate = -(this.totalSlides - 1) * this.slides.offsetWidth;
      
      if (this.currentTranslate > maxTranslate) {
        this.currentTranslate = maxTranslate + diff * 0.2;
      } else if (this.currentTranslate < minTranslate) {
        this.currentTranslate = minTranslate + (this.currentTranslate - minTranslate) * 0.2;
      }
      
      this.updateSlidePosition(this.currentTranslate);
    }
    
    // Prevent vertical scroll when swiping horizontally
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  }
  
  handleTouchEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.slides.style.transition = '';
    this.classList.remove('is-touching');
    
    const movedBy = this.currentTranslate - this.startTranslate;
    const threshold = this.slides.offsetWidth * 0.2;
    
    if (Math.abs(movedBy) > threshold) {
      this.hasInteracted = true;
    }
    
    if (movedBy < -threshold) {
      this.next();
    } else if (movedBy > threshold) {
      this.prev();
    } else {
      // Snap back to current slide
      this.updateSlidePosition();
    }
  }
  
  // Mouse handlers (for desktop drag support on smaller screens)
  handleMouseDown(e) {
    // Only enable on smaller screens or if explicitly wanted
    if (window.innerWidth > 749) return;
    
    this.touchStartX = e.clientX;
    this.isDragging = true;
    this.startTranslate = -this.currentIndex * this.slides.offsetWidth;
    this.slides.style.transition = 'none';
    e.preventDefault();
  }
  
  handleMouseMove(e) {
    if (!this.isDragging || window.innerWidth > 749) return;
    
    const currentX = e.clientX;
    const diff = currentX - this.touchStartX;
    this.currentTranslate = this.startTranslate + diff;
    
    if (this.isInfinite) {
      this.updateSlidePosition(this.currentTranslate);
    } else {
      const maxTranslate = 0;
      const minTranslate = -(this.totalSlides - 1) * this.slides.offsetWidth;
      
      if (this.currentTranslate > maxTranslate) {
        this.currentTranslate = maxTranslate + diff * 0.2;
      } else if (this.currentTranslate < minTranslate) {
        this.currentTranslate = minTranslate + (this.currentTranslate - minTranslate) * 0.2;
      }
      
      this.updateSlidePosition(this.currentTranslate);
    }
  }
  
  handleMouseUp() {
    if (!this.isDragging || window.innerWidth > 749) return;
    
    this.isDragging = false;
    this.slides.style.transition = '';
    
    const movedBy = this.currentTranslate - this.startTranslate;
    const threshold = this.slides.offsetWidth * 0.2;
    
    if (movedBy < -threshold) {
      this.next();
    } else if (movedBy > threshold) {
      this.prev();
    } else {
      this.updateSlidePosition();
    }
  }
}

customElements.define('card-carousel', CardCarousel);


