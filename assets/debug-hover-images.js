// Debug script for hover image functionality
(function() {
  console.log('=== Hover Image Debug ===');
  
  // Find all media containers with hover effect
  const hoverContainers = document.querySelectorAll('.media.media--hover-effect');
  console.log('Found', hoverContainers.length, 'hover effect containers');
  
  hoverContainers.forEach((container, index) => {
    const images = container.querySelectorAll('img');
    console.log(`Container ${index + 1}:`, {
      totalImages: images.length,
      firstImage: images[0] ? {
        src: images[0].src,
        alt: images[0].alt,
        opacity: window.getComputedStyle(images[0]).opacity
      } : null,
      secondImage: images[1] ? {
        src: images[1].src,
        alt: images[1].alt,
        opacity: window.getComputedStyle(images[1]).opacity,
        hasDebugAttr: images[1].hasAttribute('data-debug')
      } : null,
      containerClasses: container.className,
      parentCardWrapper: container.closest('.card-wrapper') ? 'found' : 'not found'
    });
    
    // Check if second image exists
    if (images.length < 2) {
      console.warn(`Container ${index + 1}: Only ${images.length} image(s) found. Expected 2 for hover effect.`);
      
      // Check for debug comments
      const debugComment = container.parentElement.innerHTML.match(/<!-- DEBUG: (.*?) -->/);
      if (debugComment) {
        console.log(`Container ${index + 1} debug info:`, debugComment[1]);
      }
    }
    
    // Test hover
    const cardWrapper = container.closest('.card-wrapper, .product-card-wrapper');
    if (cardWrapper && images.length >= 2) {
      console.log(`Container ${index + 1}: Testing hover on card-wrapper...`);
      
      // Simulate hover
      const mouseenterEvent = new Event('mouseenter', { bubbles: true });
      cardWrapper.dispatchEvent(mouseenterEvent);
      
      setTimeout(() => {
        const firstImgOpacity = window.getComputedStyle(images[0]).opacity;
        const secondImgOpacity = window.getComputedStyle(images[1]).opacity;
        console.log(`Container ${index + 1} after hover simulation:`, {
          firstImageOpacity: firstImgOpacity,
          secondImageOpacity: secondImgOpacity
        });
      }, 100);
    }
  });
  
  // Check CSS rules
  const styleSheets = Array.from(document.styleSheets);
  let hoverRulesFound = 0;
  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.selectorText && rule.selectorText.includes('media--hover-effect') && rule.selectorText.includes('hover')) {
          hoverRulesFound++;
          console.log('Found hover CSS rule:', rule.selectorText, rule.cssText);
        }
      });
    } catch (e) {
      // Cross-origin stylesheet, skip
    }
  });
  console.log('Total hover CSS rules found:', hoverRulesFound);
  
  console.log('=== End Debug ===');
})();
