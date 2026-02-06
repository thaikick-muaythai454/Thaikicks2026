import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowUpRight, Hexagon, Loader2, MessageSquare } from 'lucide-react';
import { chatWithGemini } from '../services/geminiService';
import { GYMS } from '../lib/data';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([
    { role: 'model', parts: [{ text: 'KRU.AI ONLINE. READY FOR INQUIRY.' }] }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setLoading(true);

    const newHistory = [...messages, { role: 'user' as const, parts: [{ text: userMsg }] }];
    setMessages(newHistory);

    // 1. Check for specific keywords to use Real Data (Simulated Logic)
    if (userMsg.toLowerCase().includes('price')) {
      const gym = GYMS[0]; // "Price of the first gym"
      const responseText = `Current rates for ${gym.name}: ฿${gym.basePrice} per session. ${gym.isFlashSale ? `FLASH SALE ACTIVE: -${gym.flashSaleDiscount}%` : ''}`;
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
        setLoading(false);
      }, 800);
      return;
    }

    // 2. Fallback to AI for general chat
    const responseText = await chatWithGemini(userMsg, messages);
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText || "LINK SEVERED." }] }]);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-charcoal text-white border-2 border-brand-blue hover:bg-brand-red transition-colors duration-300 z-50 flex items-center justify-center shadow-[4px_4px_0px_0px_#3471AE]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-4 md:right-8 w-[90vw] md:w-96 h-[500px] bg-white border-2 border-brand-charcoal z-50 flex flex-col shadow-[8px_8px_0px_0px_#3471AE] animate-reveal">
          {/* Header */}
          <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-brand-red"></div>
              <div>
                <h3 className="font-black text-sm tracking-tight uppercase text-brand-charcoal">KRU AI TERMINAL</h3>
                <p className="font-mono text-[10px] text-brand-blue">V.3.1 - CONNECTED</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="font-mono text-[10px] text-brand-blue mb-1 uppercase tracking-widest">
                  {msg.role === 'user' ? 'FIGHTER' : 'TRAINER'}
                </span>
                <div
                  className={`max-w-[85%] p-4 text-sm font-medium border-2 ${
                    msg.role === 'user'
                      ? 'bg-brand-charcoal text-white border-brand-charcoal'
                      : 'bg-brand-bone border-brand-charcoal text-brand-charcoal'
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex flex-col items-start">
                 <span className="font-mono text-[10px] text-brand-blue mb-1 uppercase">TRAINER</span>
                 <div className="p-3 bg-brand-bone border-2 border-brand-charcoal">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t-2 border-brand-charcoal">
            <div className="flex items-center gap-0 border-2 border-brand-charcoal">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="ENTER INQUIRY..."
                className="flex-1 bg-transparent font-mono text-sm p-3 focus:outline-none placeholder:text-gray-400 text-brand-charcoal"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="p-3 bg-brand-red text-white hover:bg-brand-charcoal transition-colors border-l-2 border-brand-charcoal disabled:opacity-50"
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;