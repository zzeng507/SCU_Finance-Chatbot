import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <div className="p-4 md:p-6 bg-white border-t border-gray-200 sticky bottom-0 z-10">
      <form 
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-scu-primary focus-within:ring-1 focus-within:ring-scu-primary transition-all shadow-sm"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a question about Finance courses..."
          className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-3 text-gray-700 placeholder-gray-400 max-h-[120px] overflow-y-auto scrollbar-default"
          rows={1}
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 ${
            text.trim() && !disabled
              ? 'bg-scu-primary text-white shadow-md hover:bg-scu-dark hover:shadow-lg transform hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send size={20} />
        </button>
      </form>
      <div className="text-center mt-2">
        <p className="text-[10px] text-gray-400">AI responses may be inaccurate. Verify with SCU Bulletin.</p>
      </div>
    </div>
  );
};
