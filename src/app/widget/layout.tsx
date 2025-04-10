import React from 'react';

export const metadata = {
  title: 'Scholarship Chatbot Widget',
  description: 'Embedded widget for the scholarship chatbot',
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="widget-layout">
      {children}
    </div>
  );
}
