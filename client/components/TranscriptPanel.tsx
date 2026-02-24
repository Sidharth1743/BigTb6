'use client';

import { useEffect, useRef } from 'react';

export interface TranscriptMessage {
  id: string;
  speaker: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg border border-teal-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
        <h3 className="text-lg font-semibold text-teal-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Conversation
          <span className="ml-auto text-sm font-normal text-teal-600">
            {messages.length} messages
          </span>
        </h3>
      </div>
      
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="h-80 overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 bg-teal-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Start talking to begin the conversation...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.speaker === 'user' 
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white' 
                    : 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-900 border border-teal-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className={`text-xs mt-1.5 block ${
                  msg.speaker === 'user' ? 'text-teal-200' : 'text-teal-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
