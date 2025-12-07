/**
 * Updates product gallery when variant changes for products with variant-specific images
 */

document.addEventListener('DOMContentLoaded', function() {
  const gallery = document.querySelector('media-gallery[data-variant-gallery="true"]');
  
  if (!gallery) return;
  
  const productForm = document.querySelector('product-form');
  const sectionId = gallery.dataset.sectionId;
  
  if (!productForm) return;
  
  function updateGallery(variantId) {
    // Get current product URL and update with new variant
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('variant', variantId);
    
    // Fetch the updated product HTML with the new variant
    fetch(`${currentUrl.pathname}?variant=${variantId}&section_id=${sectionId}`)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find the gallery in the fetched HTML
        const newGalleryWrapper = doc.querySelector('#GalleryViewer-' + sectionId);
        const currentGalleryWrapper = document.querySelector('#GalleryViewer-' + sectionId);
        
        if (newGalleryWrapper && currentGalleryWrapper) {
          // Replace the gallery viewer content
          currentGalleryWrapper.innerHTML = newGalleryWrapper.innerHTML;
          
          // Update thumbnails if they exist
          const newThumbnails = doc.querySelector('#GalleryThumbnails-' + sectionId);
          const currentThumbnails = document.querySelector('#GalleryThumbnails-' + sectionId);
          
          if (newThumbnails && currentThumbnails) {
            const newThumbList = newThumbnails.querySelector('#Slider-Thumbnails-' + sectionId);
            const currentThumbList = currentThumbnails.querySelector('#Slider-Thumbnails-' + sectionId);
            
            if (newThumbList && currentThumbList) {
              currentThumbList.innerHTML = newThumbList.innerHTML;
            }
          }
          
          // Update modal content
          const newModalContent = doc.querySelector('#ProductModal-' + sectionId + ' .product-media-modal__content');
          const currentModalContent = document.querySelector('#ProductModal-' + sectionId + ' .product-media-modal__content');
          
          if (newModalContent && currentModalContent) {
            currentModalContent.innerHTML = newModalContent.innerHTML;
          }
          
          // Re-initialize slider
          reinitializeSlider();
          
          // Update URL without page reload
          window.history.replaceState({}, '', currentUrl.toString());
        }
      })
      .catch(error => {
        console.error('Error updating gallery:', error);
      });
  }
  
  function reinitializeSlider() {
    const sliderComponent = gallery.querySelector('slider-component');
    if (sliderComponent) {
      // Reset to first slide
      const firstSlide = sliderComponent.querySelector('.slider__slide');
      if (firstSlide) {
        const slideId = firstSlide.dataset.mediaId;
        
        // Update active states
        sliderComponent.querySelectorAll('.slider__slide').forEach(slide => {
          slide.classList.remove('is-active');
        });
        firstSlide.classList.add('is-active');
        
        // Update thumbnail active states
        document.querySelectorAll('.thumbnail-list__item button').forEach(btn => {
          btn.removeAttribute('aria-current');
        });
        const firstThumb = document.querySelector('.thumbnail-list__item button');
        if (firstThumb) {
          firstThumb.setAttribute('aria-current', 'true');
        }
        
        // Reset slider position
        const sliderList = sliderComponent.querySelector('.product__media-list');
        if (sliderList) {
          sliderList.style.transform = 'translateX(0)';
        }
      }
    }
  }
  
  // Listen for variant changes from the variant picker
  productForm.addEventListener('change', function(event) {
    // Check if the change is from a variant option
    if (event.target.name && (event.target.name === 'id' || event.target.name.startsWith('options'))) {
      setTimeout(() => {
        const variantInput = productForm.querySelector('input[name="id"]');
        if (variantInput && variantInput.value) {
          updateGallery(variantInput.value);
        }
      }, 100);
    }
  });
  
  // Also listen for the variant:change custom event
  document.addEventListener('variant:change', function(event) {
    if (event.detail && event.detail.variant && event.detail.variant.id) {
      updateGallery(event.detail.variant.id);
    }
  });
});

