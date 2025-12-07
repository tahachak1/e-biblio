import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import api from '../services/api';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const DEFAULT_MODEL = 'gpt-4o-mini';

type ChatbotWidgetProps = {
  open: boolean;
  onClose: () => void;
};

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ open, onClose }) => {
  const defaultMessages: ChatMessage[] = [
    {
      role: 'system',
      content: `Vous êtes un assistant virtuel pour e-Biblio, une plateforme de bibliothèque en ligne. 
      e-Biblio permet aux utilisateurs de:
      - Parcourir et rechercher des livres
      - Créer un compte utilisateur
      - Ajouter des livres au panier
      - Passer des commandes
      - Consulter leurs commandes passées
      - Gérer leur profil
      
      Répondez de manière helpful et amicale. Si vous ne connaissez pas quelque chose, dites-le honnêtement.
      Restez concentré sur les fonctionnalités d'e-Biblio et les questions liées aux livres et à la plateforme.`
    },
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant e-Biblio. Comment puis-je vous aider avec votre bibliothèque en ligne ?' },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAtBottom = () => {
    const el = messagesRef.current;
    if (!el) return true;
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollTop + clientHeight >= scrollHeight - 1;
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
    updateScrollState();
  }, [open]);

  useEffect(() => {
    updateScrollState();
  }, []);

  const updateScrollState = () => {
    const el = messagesRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 8);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 8);
  };

  const scrollToTop = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const wasAtBottom = isAtBottom();
    const newMessages = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await api.chatbot.ask({
        model: DEFAULT_MODEL,
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.4,
      });
      const answer = data?.reply || "Je n'ai pas pu obtenir de réponse.";
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Impossible de contacter l'assistant. Vérifiez la clé serveur (OPENAI_API_KEY) et le microservice chatbot." },
      ]);
    } finally {
      setLoading(false);
      if (wasAtBottom) {
        scrollToBottom();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed right-4 bottom-6 z-[2000] flex-shrink-0"
      style={{ width: 320, height: 400 }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col w-full h-full min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                AI
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Assistant e-Biblio</p>
              <p className="text-xs text-slate-500">Messagerie OpenAI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le chatbot" className="h-8 w-8">
            <X className="w-4 h-4 text-slate-600" />
          </Button>
        </div>

        <div className="flex flex-col" style={{ height: 'calc(100% - 120px)' }}>
          <div
            className="px-4 py-3 bg-white overflow-y-auto overscroll-contain touch-pan-y relative"
            ref={messagesRef}
            onScroll={updateScrollState}
            style={{ scrollBehavior: 'smooth', height: '100%' }}
          >
            <div className="space-y-3 text-sm leading-relaxed bg-white">
              {messages.filter(msg => msg.role !== 'system').map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-3 py-2 max-w-[85%] break-words whitespace-pre-wrap shadow-sm rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white border border-blue-600 rounded-br-md'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: '#0084ff', borderColor: '#0084ff', color: '#fff' } : undefined}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            {(canScrollUp || canScrollDown) && (
              <div className="absolute right-2 bottom-2 flex flex-col gap-1">
                {canScrollUp && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                    onClick={scrollToTop}
                    aria-label="Remonter"
                  >
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  </Button>
                )}
                {canScrollDown && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                    onClick={scrollToBottom}
                    aria-label="Descendre"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border-t border-slate-200 px-3 py-3">
            <div className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris ton message..."
                className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-white border-slate-200 focus-visible:ring-slate-200 rounded-xl text-sm"
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()} className="h-11 px-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Modèle : {DEFAULT_MODEL}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
