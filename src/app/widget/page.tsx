'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWidget from '@/components/widget/ChatWidget';

// Widget content component that uses useSearchParams
function WidgetContent() {
  const searchParams = useSearchParams();

  // Get configuration from query parameters
  const title = searchParams.get('title') || undefined;
  const subtitle = searchParams.get('subtitle') || undefined;
  const position = searchParams.get('position') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | undefined;

  // Set up communication with parent window
  useEffect(() => {
    const sendMessage = (message: { type: string; width?: number; height?: number }) => {
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
    <ChatWidget
      title={title}
      subtitle={subtitle}
      position={position}
    />
  );
}

export default function WidgetPage() {
  return (
    <div className="widget-container">
      <Suspense fallback={<div>Loading...</div>}>
        <WidgetContent />
      </Suspense>
    </div>
  );
}
