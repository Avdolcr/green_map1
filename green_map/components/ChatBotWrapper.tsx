'use client';

import dynamic from 'next/dynamic';

// Dynamically load ChatBot component with no SSR to avoid hydration issues
const ChatBot = dynamic(() => import('./ChatBot'), { ssr: false });

export default function ChatBotWrapper() {
  return <ChatBot />;
}
