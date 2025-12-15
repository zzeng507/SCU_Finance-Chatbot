import React from 'react';
import { Role, Message } from '../types';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === Role.Bot;

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isBot ? 'flex-row' : 'flex-row-reverse'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-scu-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm
            ${isBot 
              ? 'bg-white border-l-4 border-scu-primary text-gray-800 rounded-bl-none' 
              : 'bg-gray-100 text-gray-800 rounded-br-none'
            }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className={`text-[10px] mt-1 opacity-50 ${isBot ? 'text-left' : 'text-right'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
