/**
 * Card Image Carousel
 * Handles arrow navigation on desktop and swipe on mobile
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
    
    // Touch/swipe variables
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isDragging = false;
    this.startTranslate = 0;
    this.currentTranslate = 0;
    
    this.init();
  }
  
  init() {
    if (this.totalSlides <= 1) return;
    
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
    this.slides.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.slides.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.slides.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Mouse events for desktop drag (optional)
    this.slides.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.slides.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.slides.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.slides.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    this.updateButtons();
  }
  
  prev() {
    if (this.currentIndex > 0) {
      this.goToSlide(this.currentIndex - 1);
    }
  }
  
  next() {
    if (this.currentIndex < this.totalSlides - 1) {
      this.goToSlide(this.currentIndex + 1);
    }
  }
  
  goToSlide(index) {
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
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex === 0;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex === this.totalSlides - 1;
    }
  }
  
  updateDots() {
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === this.currentIndex);
    });
  }
  
  // Touch handlers
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.isDragging = true;
    this.startTranslate = -this.currentIndex * this.slides.offsetWidth;
    this.slides.classList.add('is-dragging');
    this.classList.add('is-touching');
  }
  
  handleTouchMove(e) {
    if (!this.isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - this.touchStartX;
    this.currentTranslate = this.startTranslate + diff;
    
    // Limit dragging at edges
    const maxTranslate = 0;
    const minTranslate = -(this.totalSlides - 1) * this.slides.offsetWidth;
    
    if (this.currentTranslate > maxTranslate) {
      this.currentTranslate = maxTranslate + diff * 0.2;
    } else if (this.currentTranslate < minTranslate) {
      this.currentTranslate = minTranslate + (this.currentTranslate - minTranslate) * 0.2;
    }
    
    this.updateSlidePosition(this.currentTranslate);
    
    // Prevent vertical scroll when swiping horizontally
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  }
  
  handleTouchEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.slides.classList.remove('is-dragging');
    this.classList.remove('is-touching');
    
    const movedBy = this.currentTranslate - this.startTranslate;
    const threshold = this.slides.offsetWidth * 0.2;
    
    if (movedBy < -threshold && this.currentIndex < this.totalSlides - 1) {
      this.currentIndex++;
    } else if (movedBy > threshold && this.currentIndex > 0) {
      this.currentIndex--;
    }
    
    this.updateSlidePosition();
    this.updateButtons();
    this.updateDots();
  }
  
  // Mouse handlers (for desktop drag support)
  handleMouseDown(e) {
    // Only on mobile-like behavior or if specifically wanted
    if (window.innerWidth > 749) return;
    
    this.touchStartX = e.clientX;
    this.isDragging = true;
    this.startTranslate = -this.currentIndex * this.slides.offsetWidth;
    this.slides.classList.add('is-dragging');
  }
  
  handleMouseMove(e) {
    if (!this.isDragging || window.innerWidth > 749) return;
    
    const currentX = e.clientX;
    const diff = currentX - this.touchStartX;
    this.currentTranslate = this.startTranslate + diff;
    
    const maxTranslate = 0;
    const minTranslate = -(this.totalSlides - 1) * this.slides.offsetWidth;
    
    if (this.currentTranslate > maxTranslate) {
      this.currentTranslate = maxTranslate + diff * 0.2;
    } else if (this.currentTranslate < minTranslate) {
      this.currentTranslate = minTranslate + (this.currentTranslate - minTranslate) * 0.2;
    }
    
    this.updateSlidePosition(this.currentTranslate);
  }
  
  handleMouseUp() {
    if (!this.isDragging || window.innerWidth > 749) return;
    
    this.isDragging = false;
    this.slides.classList.remove('is-dragging');
    
    const movedBy = this.currentTranslate - this.startTranslate;
    const threshold = this.slides.offsetWidth * 0.2;
    
    if (movedBy < -threshold && this.currentIndex < this.totalSlides - 1) {
      this.currentIndex++;
    } else if (movedBy > threshold && this.currentIndex > 0) {
      this.currentIndex--;
    }
    
    this.updateSlidePosition();
    this.updateButtons();
    this.updateDots();
  }
}

customElements.define('card-carousel', CardCarousel);

