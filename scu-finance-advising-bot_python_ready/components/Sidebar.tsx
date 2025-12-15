import React from 'react';
import { Settings, GraduationCap, BookOpen, X } from 'lucide-react';
import { SidebarProps } from '../types';

export const Sidebar: React.FC<SidebarProps> = ({ 
  onExampleClick, 
  isOpen, 
  toggleSidebar 
}) => {
  const examples = [
    "Prerequisites for FNCE 124?",
    "What classes for Finance Major?",
    "Tell me about the Real Estate Minor"
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={`
          fixed md:relative z-30 w-72 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl md:shadow-none transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-scu-primary font-bold text-xl">
            <GraduationCap size={28} />
            <span>Finance Bot</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-scu-primary">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          
          {/* Status Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Status</h3>
            <div className="flex items-center gap-3 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              System Online
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Knowledge Base</h3>
            <div className="space-y-2">
              {examples.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onExampleClick(text);
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-scu-primary rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-gray-100 group"
                >
                  <BookOpen size={16} className="text-gray-400 group-hover:text-scu-primary" />
                  {text}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 px-2 mt-4">
              Accessing: Excel course lists, PDF Requirements, and Prerequisites charts.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
            <Settings size={12} />
            <span>SCU NLP Final Project</span>
          </div>
        </div>
      </aside>
    </>
  );
};