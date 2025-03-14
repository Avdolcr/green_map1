// Center map page script
document.addEventListener('DOMContentLoaded', function() {
  // Only run on Explore Map page
  if (window.location.pathname.includes('/Explore_Map')) {
    console.log('Applying centering to Explore Map page');
    
    // Create a style element
    const style = document.createElement('style');
    
    // Add CSS to center the content
    style.textContent = `
      .main-container {
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 16px !important;
      }
      
      .explore-map-page {
        width: 100% !important;
        max-width: 1400px !important;
        margin: 0 auto !important;
      }
      
      .top-row {
        display: flex !important;
        justify-content: space-between !important;
        gap: 20px !important;
        width: 100% !important;
      }
      
      .top-row .map-container {
        width: 50% !important;
      }
      
      .top-row .list-container {
        width: 50% !important;
      }
      
      .tree-details {
        width: 100% !important;
        max-width: 1400px !important;
        margin: 0 auto !important;
      }
      
      @media (max-width: 1024px) {
        .top-row {
          flex-direction: column !important;
        }
        
        .top-row .map-container,
        .top-row .list-container {
          width: 100% !important;
        }
      }
    `;
    
    // Add the style to the document head
    document.head.appendChild(style);
  }
}); 