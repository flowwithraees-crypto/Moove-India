import React, { useState, useRef, useEffect } from 'react';
import { travelAssistant } from '../../services/gemini';
import { PlaceDocument, HitchhikingSpot } from '../../types';
import { X, Sparkles, Send, Bot, User, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

interface TravelAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
}

interface Message {
  role: 'model' | 'user';
  text: string;
}

export const TravelAssistantDrawer: React.FC<TravelAssistantDrawerProps> = ({
  isOpen,
  onClose,
  places,
  hitchhikingSpots
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Namaste! I'm your Moove India AI Guide. I'm grounded in real community data: ask me about free Gurudwara langars, ₹5 railway RO water ATMs, verified hitchhiking bays, or ultra-budget routes across India."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const userMsg: Message = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await travelAssistant(
        q,
        messages.map(m => ({ role: m.role, text: m.text })),
        { places, spots: hitchhikingSpots }
      );
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: "I couldn't reach the server-side intelligence service right now, but here's a verified tip: unreserved general train tickets across Indian Railways are the cheapest way to travel between major nodes, and Gurudwara langars offer free wholesome community food 24/7."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "How to reach Manali from Delhi on ₹500?",
    "Where can I find free food in Amritsar?",
    "Best hitchhiking bay on NH44?",
    "How to camp cheaply in Rishikesh?"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full sm:w-[420px] h-[85vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl bg-white border border-[#E2E8E3] shadow-2xl flex flex-col text-[#17211B] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8E3] bg-[#F8FAF7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1F7A4D] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#17211B]">
                Moove India AI Guide
              </h3>
              <span className="text-[10px] text-[#1F7A4D] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A4D] animate-ping" />
                Grounded in community database
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'model' && (
                <div className="w-6 h-6 rounded-full bg-[#E8F5EC] text-[#1F7A4D] flex items-center justify-center shrink-0 mt-0.5 border border-[#1F7A4D]/20">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1F7A4D] text-white rounded-br-none shadow-sm'
                    : 'bg-[#F8FAF7] text-[#17211B] border border-[#E2E8E3] rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
              </div>

              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-[#17211B] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 rounded-full bg-[#E8F5EC] text-[#1F7A4D] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] text-xs text-[#66736B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Searching community spots...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-2.5 bg-[#F8FAF7] border-t border-[#E2E8E3] overflow-x-auto flex gap-1.5 scrollbar-none">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1 rounded-full bg-white text-[10px] font-semibold text-[#17211B] border border-[#E2E8E3] hover:border-[#1F7A4D] whitespace-nowrap transition"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E2E8E3]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cheap stays, langars, highways..."
              className="flex-1 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 px-3 text-xs text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#1F7A4D] text-white hover:bg-[#19633e] disabled:opacity-50 transition shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
