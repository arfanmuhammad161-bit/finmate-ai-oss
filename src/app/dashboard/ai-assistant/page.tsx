"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bot, User, Send, Sparkles, Clock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

const quickPrompts = [
  "Analisis pengeluaran bulan ini",
  "Buat laporan PDF",
  "Tips hemat uang makan",
  "Cek kategori paling boros"
];

interface ChatMessage {
  role: string;
  content: string;
}

const initialMessages: ChatMessage[] = [
  {
    role: 'ai',
    content: 'Halo! Saya FinMate AI, asisten keuangan pribadi Anda. Silakan tanyakan apa saja tentang keuangan Anda.'
  }
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const newMsg: ChatMessage = { 
      role: 'user', 
      content: inputValue
    };
    
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter(m => m.role !== 'system')
        })
      });

      const data = await response.json();

      // Rate limit 429 — tampilkan pesan ramah + CTA upgrade
      if (response.status === 429) {
        const upgradeHint = data.upgradeUrl
          ? `\n\n💡 [**Upgrade ke Pro**](/dashboard/settings?tab=subscription) untuk akses tanpa antrian.`
          : '';
        setMessages(prev => [...prev, {
          role: 'ai',
          content: `⏰ **AI Mode Gratis lagi padat**\n\n${data.error || 'Coba 1 menit lagi.'}${upgradeHint}`,
        }]);
        return;
      }

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        throw new Error(data.error || 'Terjadi kesalahan');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">AI Assistant</h2>
          <p className="text-sm text-text-muted mt-0.5">Chat dengan asisten keuangan pintar Anda</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col border-border overflow-hidden bg-white/50 backdrop-blur-sm">
          {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex items-start gap-4 max-w-[80%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === 'user' ? "bg-primary-100 text-primary-700" : "bg-gradient-to-br from-primary-600 to-secondary-500 text-white"
              )}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              
              <div className={cn(
                "rounded-2xl p-4 shadow-sm flex flex-col gap-2",
                msg.role === 'user' 
                  ? "bg-primary-600 text-white rounded-tr-sm" 
                  : "bg-white border border-border text-text-main rounded-tl-sm"
              )}>
                {msg.role === 'user' ? (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="text-sm prose prose-sm prose-primary max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 max-w-[80%]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="rounded-2xl p-4 shadow-sm bg-white border border-border text-text-main rounded-tl-sm">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-white">
          <div className="mb-4 flex flex-wrap gap-2">
            {quickPrompts.map((prompt, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                size="sm" 
                className="rounded-full text-xs bg-primary-50 text-primary-700 border-primary-100 hover:bg-primary-100"
                onClick={() => setInputValue(prompt)}
              >
                <Sparkles className="mr-1.5 h-3 w-3" />
                {prompt}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input 
              placeholder="Ketik pesan Anda..."
              className="flex-1 rounded-full border-gray-300 focus-visible:ring-primary-500 bg-gray-50"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
              size="icon" 
              variant="gradient" 
              className="rounded-full shrink-0 h-10 w-10 shadow-md"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-text-muted mt-3">
            FinMate AI dapat mencatat pengeluaran Anda. Cukup ketik seperti "Makan siang 20rb".
          </p>
        </div>
      </Card>
    </div>
  );
}
