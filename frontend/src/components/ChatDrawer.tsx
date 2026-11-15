import { FormEvent, useEffect, useRef, useState } from 'react';
import { Flame, MessageSquare, Send, X } from 'lucide-react';
import { ChatContext } from '../types';
import { cn } from '../lib/cn';
import api from '../lib/api';

interface ChatMessage {
  body: string;
  author: { userId: string; username: string };
  sentAt: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function ContextPin({ context }: { context: ChatContext }) {
  return (
    <div className="mx-4 mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
        <Flame className="h-3.5 w-3.5" />
        Discussing this {context.kind === 'post' ? 'post' : 'comment'}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">{context.preview}</p>
    </div>
  );
}

export interface ChatDrawerProps {
  context: ChatContext | null;
  currentUserId: string;
  onClose: () => void;
}

export default function ChatDrawer({ context, currentUserId, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (context) {
      setMessages([
        {
          body: `Hi there! I am Nexus AI. Ask me anything about "${context.preview}".`,
          author: { userId: 'nexus-ai', username: 'Nexus AI' },
          sentAt: new Date().toISOString(),
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [context]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !context) return;

    const userMsgText = draft.trim();
    setDraft('');

    // Prepare history from existing messages (excluding current new message and system errors)
    const history = messages
      .filter((m) => m.author.userId !== 'system')
      .map((m) => ({
        role: (m.author.userId === currentUserId ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.body }],
      }));

    // 1. Append user message
    const userMessage: ChatMessage = {
      body: userMsgText,
      author: { userId: currentUserId, username: 'You' },
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 2. Set typing state
    setIsTyping(true);

    try {
      // 3. Request chat response with conversational history
      const response = await api.post('/ai/chat', {
        postId: context.contextRef,
        postContext: context.preview,
        message: userMsgText,
        history,
      });

      // 4. Append AI response
      const aiMessage: ChatMessage = {
        body: response.data.text || 'I could not generate a response.',
        author: { userId: 'nexus-ai', username: 'Nexus AI' },
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Nexus AI request failed:', err);
      // 5. Append system error message
      const systemMessage: ChatMessage = {
        body: 'Sorry, I am having trouble connecting right now. Please try again.',
        author: { userId: 'system', username: 'System' },
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const isOpen = context !== null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-[1px] animate-fade-in dark:bg-black/50"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col',
          'bg-white shadow-panel dark:bg-surface-raised dark:shadow-panel-dark',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Nexus AI Assistant</h2>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {context && <ContextPin context={context} />}

        <div ref={scrollRef} className="themed-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="mt-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No messages yet.
            </p>
          )}
          {messages.map((message, index) => {
            const isOwn = message.author.userId === currentUserId;
            const isSystem = message.author.userId === 'system';
            return (
              <div
                key={`${message.sentAt}-${index}`}
                className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                    isOwn
                      ? 'bg-rose-600 text-white dark:bg-rose-500'
                      : isSystem
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-200',
                  )}
                >
                  {!isOwn && !isSystem && (
                    <p className="mb-0.5 text-xs font-bold text-rose-600 dark:text-rose-350">
                      {message.author.username}
                    </p>
                  )}
                  {message.body}
                </div>
                <span className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  {formatTime(message.sentAt)}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex flex-col items-start mt-2 animate-fade-in">
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/70 px-4 py-2.5 shadow-sm animate-pulse dark:border-rose-900/40 dark:bg-rose-950/30">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Nexus AI
                </span>
                <div className="flex items-center gap-1.5 py-0.5">
                  <span
                    className="h-2 w-2 rounded-full bg-rose-500 animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-rose-500 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-rose-500 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-zinc-200 p-4 dark:border-white/10"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask AI about this post..."
            disabled={isTyping}
            className={cn(
              'flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900',
              'placeholder:text-zinc-400 focus-visible:border-rose-455 disabled:opacity-50',
              'dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500',
            )}
          />
          <button
            type="submit"
            disabled={isTyping || !draft.trim()}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-300',
              'dark:bg-rose-500 dark:hover:bg-rose-400 dark:disabled:bg-rose-500/30',
              'transition-colors duration-150',
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
