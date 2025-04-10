'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWidget from '@/components/widget/ChatWidget';

export default function WidgetPage() {
  const searchParams = useSearchParams();

  // Get configuration from query parameters
  const title = searchParams.get('title') || undefined;
  const subtitle = searchParams.get('subtitle') || undefined;
  const position = searchParams.get('position') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | undefined;

  // Set up communication with parent window
  useEffect(() => {
    const sendMessage = (message: any) => {
      if (window.parent) {
        window.parent.postMessage(message, '*');
      }
    };

    // Notify parent that widget is loaded
    sendMessage({ type: 'loaded' });

    // Handle resize events
    const handleResize = () => {
      sendMessage({
        type: 'resize',
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="widget-container">
      <ChatWidget
        title={title}
        subtitle={subtitle}
        position={position}
      />
    </div>
  );
}
