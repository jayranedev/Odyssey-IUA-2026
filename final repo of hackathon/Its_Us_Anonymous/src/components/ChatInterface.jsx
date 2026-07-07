import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const ChatInterface = ({ messages, onSendMessage, isLoading, projectContext }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full gap-6 mb-32">
      {/* Project Context Header */}
      <div className="relative bg-white border-4 border-primary p-4 shadow-[8px_8px_0px_0px_rgba(0,52,102,0.2)] duct-tape-corner">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-primary/60 tracking-tighter">Current Build Log:</span>
          <h2 className="font-display text-2xl text-primary uppercase">{projectContext.title || "New Project"}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            {projectContext.scraps?.filter(s => s).map((scrap, i) => (
              <span key={i} className="bg-primary text-white text-[10px] px-2 py-0.5 font-bold uppercase">
                {scrap}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <span className="material-symbols-outlined text-primary/20 text-4xl">inventory_2</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end ml-12' : 'justify-start mr-12'}`}
          >
            <div className={`${
              msg.role === 'user' 
                ? 'bg-white border-[4px] border-black p-4 shadow-jugaad-black' 
                : 'bg-tertiary-container border-[4px] border-black p-4 shadow-jugaad-black'
            } relative max-w-full`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined font-bold">
                    {msg.type === 'advisory' ? 'build' : 'smart_toy'}
                  </span>
                  <span className="font-bold uppercase text-sm tracking-widest">
                    {msg.type === 'advisory' ? 'WORKSHOP ADVISORY' : 'FABRICATOR ENGINE'}
                  </span>
                </div>
              )}
              
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'font-bold text-primary italic' : 'font-bold leading-tight'}`}>
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1 pl-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-black" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>

              <div className={`mt-2 text-[10px] font-black uppercase ${msg.role === 'user' ? 'text-primary/40' : 'text-black/60'}`}>
                {msg.role === 'user' ? 'Fabricator User' : 'System Ready'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start mr-12">
            <div className="bg-tertiary-container border-[4px] border-black p-4 shadow-jugaad-black animate-pulse">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined font-bold animate-spin">settings</span>
                <span className="font-bold uppercase text-sm tracking-widest">PROCESSING SOLUTIONS...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-24 left-0 w-full px-margin py-4 bg-background/80 backdrop-blur-sm z-40">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative bg-white border-2 border-black p-2 flex items-center gap-2 shadow-jugaad-blue-lg">
            <div className="absolute -top-3 left-4 bg-yellow-400 border-2 border-black px-2 text-[10px] font-black uppercase">Technical Input</div>
            <input 
              className="flex-grow bg-transparent border-none focus:ring-0 font-display font-bold text-sm placeholder:text-primary/30" 
              placeholder="ASK ABOUT MATERIALS, ASSEMBLY, OR MAINTENANCE..." 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-primary text-white p-2 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
