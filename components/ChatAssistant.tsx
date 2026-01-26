import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';
import { sendMessageToGemini, ChatMessage } from '../utils/geminiApi';

const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const newMessages: ChatMessage[] = [
            ...messages,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await sendMessageToGemini(messages, userMessage);
            setMessages([
                ...newMessages,
                { role: 'model', parts: [{ text: response }] }
            ]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages([
                ...newMessages,
                { role: 'model', parts: [{ text: 'Lo siento, tuve un problema de conexión. ¿Podrías intentar de nuevo? (Asegúrate de que la API Key esté configurada)' }] }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-[60] group border border-white/20"
            >
                <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-12 right-0 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 shadow-xl pointer-events-none">
                    ¿Necesitas ayuda? Pregúntame
                </span>
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] ${isMinimized ? 'h-16' : 'h-[500px]'} bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 z-[60] overflow-hidden`}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">Asistente PLS</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title={isMinimized ? "Maximizar" : "Minimizar"}
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Cerrar chat"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-2">
                                    <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
                                </div>
                                <h4 className="text-white font-medium italic">¡Hola! Soy tu guía en ThePlayer.gg</h4>
                                <p className="text-sm text-slate-500">
                                    Pregúntame sobre tiendas cercanas, próximos torneos o cómo funciona nuestro ranking.
                                </p>
                                <div className="grid grid-cols-1 gap-2 w-full pt-4">
                                    {[
                                        '¿Dónde puedo jugar Magic?',
                                        '¿Cuándo son los próximos torneos?',
                                        '¿Cómo funciona el ranking Player Points?'
                                    ].map((sug) => (
                                        <button
                                            key={sug}
                                            onClick={() => {
                                                setInput(sug);
                                                // Trigger manual send logically? 
                                                // Simplified: just set input and let user press Enter or manual button
                                            }}
                                            className="text-xs p-2.5 bg-slate-800/50 hover:bg-blue-600/20 border border-white/5 rounded-xl text-slate-300 hover:text-blue-400 transition-all text-left"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-800 text-slate-200 border border-white/5'
                                    }`}>
                                    {m.parts[0].text}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-white/5">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-slate-900/50 border-t border-white/5">
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                disabled={isLoading}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-700"
                                title="Enviar mensaje"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2 text-center uppercase tracking-widest font-black">
                            Powered by Google Gemini
                        </p>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatAssistant;
