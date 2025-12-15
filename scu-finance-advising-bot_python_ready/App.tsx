import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { InputArea } from './components/InputArea';
import { Message, Role } from './types';
import { generateRagResponse } from './services/ragService';
import { Menu, AlertCircle } from 'lucide-react';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: Role.Bot,
  content: "Hello! I am the SCU Finance Advising Assistant. I have access to the Finance Department documents, course catalogs, and prerequisites. Ask me anything!",
  timestamp: new Date(),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.User,
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setConnectionError(false);

    try {
      // Direct call to your Python RAG Backend
      const responseText = await generateRagResponse(text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.Bot,
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setConnectionError(true);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.Bot,
        content: "⚠️ **Connection Error**: I cannot reach the Python backend.\n\nMake sure your `server.py` is running on port 8000.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      
      {/* Sidebar */}
      <Sidebar 
        onExampleClick={handleSend}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 hover:text-scu-primary"
            >
              <Menu size={24} />
            </button>
            <span className="font-semibold text-scu-primary">Finance Bot</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </header>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-default bg-[#fafafa]"
        >
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            
            {connectionError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4 border border-red-100">
                <AlertCircle size={16} />
                <span>Error: Ensure Python server is running (`python server.py`).</span>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <InputArea onSend={handleSend} disabled={isTyping} />

      </main>
    </div>
  );
}