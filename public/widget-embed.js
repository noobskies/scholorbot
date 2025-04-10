/**
 * Scholarship Chatbot Widget Embed Script
 *
 * This script can be added to any website to embed the scholarship chatbot widget.
 *
 * Usage:
 * <script src="https://your-domain.com/widget-embed.js"
 *   data-title="Custom Title"
 *   data-subtitle="Custom Subtitle"
 *   data-position="bottom-right">
 * </script>
 */

(function() {
  // Create widget container
  const container = document.createElement('div');
  container.id = 'scholarship-chatbot-widget';
  document.body.appendChild(container);

  // Get script element
  const scriptElement = document.currentScript;

  // Get configuration from data attributes
  const config = {
    title: scriptElement.getAttribute('data-title'),
    subtitle: scriptElement.getAttribute('data-subtitle'),
    position: scriptElement.getAttribute('data-position'),
  };

  // Create URL with query parameters
  let widgetUrl = 'https://your-domain.com/widget';

  if (config.title || config.subtitle || config.position) {
    widgetUrl += '?';

    if (config.title) widgetUrl += `title=${encodeURIComponent(config.title)}&`;
    if (config.subtitle) widgetUrl += `subtitle=${encodeURIComponent(config.subtitle)}&`;
    if (config.position) widgetUrl += `position=${encodeURIComponent(config.position)}&`;

    // Remove trailing &
    widgetUrl = widgetUrl.replace(/&$/, '');
  }

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.style.border = 'none';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.right = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.zIndex = '9999';
  iframe.style.background = 'transparent';
  iframe.style.pointerEvents = 'none';

  // Add iframe to container
  container.appendChild(iframe);

  // Add message listener for iframe communication
  window.addEventListener('message', function(event) {
    // Verify origin
    if (event.origin !== 'https://your-domain.com') return;

    // Handle messages from iframe
    if (event.data.type === 'resize') {
      // Resize iframe if needed
    }
  });
})();
