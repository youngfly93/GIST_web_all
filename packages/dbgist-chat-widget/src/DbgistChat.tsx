import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

// ── tokens (panel-simple TEAL palette, aligned with dbGIST #1C484C brand) ─
const TEAL = '#0f4c4a';
const TEAL_LIGHT = '#e8f1f0';
const TEAL_MID = '#2a7a76';
const AMBER = '#f4b942';

// ── types ──────────────────────────────────────────────────────────────────
export interface DbgistChatProps {
  backendUrl?: string;
  sessionId?: string;
  appTag?: string;
  defaultOpen?: boolean;
  theme?: 'light' | 'dark';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  isStreaming?: boolean;
}

interface FigureContext {
  imageSrc?: string;
  gene?: string;
  analysisType?: string;
  ts: number;
  pendingPrompt?: string;
  pendingImagePath?: string;
}

interface AnalyzeTrigger {
  plotPath?: string;
  relativePath?: string;
  gene1?: string;
  gene2?: string;
  analysisType?: string;
  autoTriggered?: boolean;
}

// ── helpers ────────────────────────────────────────────────────────────────
const rid = () => Math.random().toString(36).slice(2, 10);
const sizeKey = (sessionId: string) => `dbgist-chat:size:${sessionId || 'default'}`;
const normalize = (s: string) =>
  s.replace(/\r\n/g, '\n').replace(/\u0000/g, '').replace(/\n{3,}/g, '\n\n');

const resolveImageSrc = (p?: string): string | undefined => {
  if (!p) return undefined;
  if (p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://')) return p;
  // Already a server-rooted path? Pass through unchanged.
  const isWebPrefix = p.startsWith('/api/') || p.startsWith('/plots/') ||
                      p.startsWith('/assets/') || p.startsWith('/static/') ||
                      p.startsWith('/');
  if (isWebPrefix) return p;
  // Absolute filesystem path (e.g. '/home/.../plot.png' caught above; on Windows
  // 'C:\...' falls through here). Strip to filename so we don't leak local paths.
  if (/^[A-Za-z]:[\\/]/.test(p)) {
    const fname = p.split('/').pop()?.split('\\').pop() || p;
    return `./${fname}`;
  }
  // Otherwise treat as a relative path (e.g. 'extwww/plot_X.png') and let the
  // browser resolve it against the current page URL. Crucially, do NOT strip
  // sub-directories — Shiny's addResourcePath() mounts assets under prefixes
  // like 'extwww/' / 'protwww/' and we must keep them.
  return `./${p}`;
};

const labelForAnalysis = (a?: string): string => {
  if (!a) return 'FIGURE';
  return a.toUpperCase().replace(/_/g, ' ');
};

const promptsFor = (gene?: string, analysisType?: string): string[] => {
  const g = gene || 'this gene';
  const a = analysisType || 'the figure';
  return [
    `What does this ${a} mean clinically for ${g} in GIST?`,
    `Is ${g} a known GIST driver / marker?`,
    `Summarize this in one paragraph for a paper.`
  ];
};

// ── inline SVG icons (panel-simple style) ──────────────────────────────────
const I = {
  Sparkle: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Close: ({ size = 14 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Trash: ({ size = 14 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
    </svg>
  ),
  Refresh: ({ size = 14 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" />
    </svg>
  ),
  Send: ({ size = 13 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l16-8-6 18-3-7-7-3z" />
    </svg>
  ),
  Stop: ({ size = 12 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
  ),
  Copy: ({ size = 11 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
};

// ── markdown renderers ────────────────────────────────────────────────────
const md = {
  p: ({ children }: any) => <p style={{ margin: '0.25em 0', lineHeight: 1.55 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontSize: '1.05em', fontWeight: 700, margin: '0.45em 0 0.25em', color: TEAL }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontSize: '1em', fontWeight: 700, margin: '0.4em 0 0.2em', color: TEAL }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontSize: '0.95em', fontWeight: 700, margin: '0.4em 0 0.2em', color: TEAL }}>{children}</h3>,
  ul: ({ children }: any) => <ul style={{ margin: '0.3em 0', paddingLeft: '1.15em' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ margin: '0.3em 0', paddingLeft: '1.15em' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ margin: '0.12em 0' }}>{children}</li>,
  code: ({ children }: any) => (
    <code style={{ background: '#f1f5f4', padding: '0.1em 0.32em', borderRadius: 3, fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.88em', color: TEAL }}>{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre style={{ background: '#f1f5f4', padding: '0.5em 0.7em', borderRadius: 6, overflow: 'auto', margin: '0.4em 0', fontSize: '0.84em', fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>{children}</pre>
  ),
  strong: ({ children }: any) => <strong style={{ fontWeight: 700, color: TEAL }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ fontStyle: 'italic' }}>{children}</em>
};

// ── inject Inter / JetBrains Mono once ─────────────────────────────────────
let _fontInjected = false;
const injectFontOnce = () => {
  if (_fontInjected || typeof document === 'undefined') return;
  _fontInjected = true;
  const lk = document.createElement('link');
  lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(lk);
};

// ── main component ────────────────────────────────────────────────────────
export const DbgistChat: React.FC<DbgistChatProps> = ({
  backendUrl = '/api/chat',
  sessionId = 'default',
  appTag = 'unknown',
  defaultOpen = false
}) => {
  useEffect(() => { injectFontOnce(); }, []);

  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [hasNew, setHasNew] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [currentFigure, setCurrentFigure] = useState<FigureContext | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>(() => {
    try {
      const raw = localStorage.getItem(sizeKey(sessionId));
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.w === 'number' && typeof p.h === 'number') return p;
      }
    } catch { /* noop */ }
    return { w: 400, h: 640 };
  });
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resizingRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const baseUrl = (backendUrl || '/api/chat').replace(/\/+$/, '');

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => {
    try { localStorage.setItem(sizeKey(sessionId), JSON.stringify(size)); } catch { /* noop */ }
  }, [size, sessionId]);

  // ── resize handle ────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { startX, startY, startW, startH } = resizingRef.current;
      const dx = startX - e.clientX;
      const dy = startY - e.clientY;
      setSize({
        w: Math.min(Math.max(startW + dx, 340), 1100),
        h: Math.min(Math.max(startH + dy, 460), 1000)
      });
    };
    const onUp = () => { resizingRef.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);
  const startResize = (e: React.MouseEvent) => {
    resizingRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    document.body.style.userSelect = 'none';
  };

  const notifyRunning = (running: boolean) => {
    try {
      const shiny = (window as any).Shiny;
      if (shiny?.setInputValue) {
        shiny.setInputValue('ai_chat-status', { running, ts: Date.now() }, { priority: 'event' });
      }
      window.dispatchEvent(new CustomEvent('dbgist-chat-status', { detail: { running }, bubbles: true }));
    } catch { /* noop */ }
  };

  // ── trigger from Shiny: stage figure context, auto-open the panel ───────
  // We DON'T auto-send the AI request — user must click "Interpret this figure"
  // (matches panel-simple's explicit-intent design). But we DO auto-expand the
  // panel so the figure preview + Interpret CTA are immediately visible.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<AnalyzeTrigger>;
      const d = ce.detail || {};
      const imageSrc = resolveImageSrc(d.relativePath || d.plotPath);
      const gene = [d.gene1, d.gene2].filter(Boolean).join(', ');
      const prompt = [
        `Analyse this ${d.analysisType || 'analysis'} figure from a GIST study.`,
        gene ? `Gene(s): ${gene}.` : '',
        'Cover statistical significance, biological interpretation, clinical relevance, and limitations.',
        'Output: concise bullets (max 5, ≤20 words each), no pleasantries.'
      ].filter(Boolean).join(' ');
      setCurrentFigure({
        imageSrc,
        gene: gene || undefined,
        analysisType: d.analysisType,
        ts: Date.now(),
        pendingPrompt: prompt,
        pendingImagePath: d.plotPath || d.relativePath
      });
      setMessages([]);
      setOpen(true);
      setHasNew(false);
    };
    const el = document.querySelectorAll('dbgist-chat');
    el.forEach((node) => node.addEventListener('dbgist-chat-trigger', handler as EventListener));
    window.addEventListener('dbgist-chat-trigger', handler as EventListener);
    return () => {
      el.forEach((node) => node.removeEventListener('dbgist-chat-trigger', handler as EventListener));
      window.removeEventListener('dbgist-chat-trigger', handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── core send ────────────────────────────────────────────────────────────
  const sendMessage = async (text: string, imagePath?: string) => {
    if (!text.trim() && !imagePath) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const userMsg: ChatMessage = { id: rid(), role: 'user', content: text, image: imagePath };
    const botMsg: ChatMessage = { id: rid(), role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setStreaming(true);
    notifyRunning(true);

    try {
      const res = await fetch(baseUrl + '/', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-dbgist-app': appTag,
          'x-dbgist-session-id': sessionId
        },
        body: JSON.stringify({ message: text, image: imagePath, stream: true })
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('no response body');
      const dec = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        acc += chunk;
        const snapshot = acc;
        setMessages((prev) => prev.map(m => m.id === botMsg.id ? { ...m, content: snapshot } : m));
      }
      setMessages((prev) => prev.map(m => m.id === botMsg.id ? { ...m, isStreaming: false } : m));
    } catch (err: any) {
      const aborted = err?.name === 'AbortError';
      setMessages((prev) => prev.map(m => m.id === botMsg.id ? {
        ...m,
        content: aborted ? '_已取消。_' : `**Error**: ${err?.message || 'AI service unavailable'}`,
        isStreaming: false
      } : m));
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setStreaming(false);
      notifyRunning(false);
    }
  };

  const cancel = () => abortRef.current?.abort();
  const clearAll = () => { cancel(); setMessages([]); };
  const refresh = () => {
    if (currentFigure?.pendingPrompt) {
      sendMessage(currentFigure.pendingPrompt, currentFigure.pendingImagePath);
    }
  };
  const interpretFigure = () => {
    if (currentFigure?.pendingPrompt) {
      sendMessage(currentFigure.pendingPrompt, currentFigure.pendingImagePath);
    }
  };
  const askPick = (q: string) => {
    sendMessage(q, currentFigure?.pendingImagePath);
  };

  const copy = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => { /* noop */ });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const t = input;
      setInput('');
      void sendMessage(t, currentFigure?.pendingImagePath);
    }
  };

  // ─────────────────────────── COLLAPSED: FabB ───────────────────────────
  if (!open) {
    return <FabB hasNew={hasNew} onClick={() => { setOpen(true); setHasNew(false); }} />;
  }

  // ─────────────────────────── EXPANDED: panel-simple ────────────────────
  const isMobile = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(max-width: 640px)').matches;

  const shellStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', inset: 0, zIndex: 10000,
        background: '#fff',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
        color: '#1a1f1e'
      }
    : {
        position: 'fixed', right: 24, bottom: 24, zIndex: 10000,
        width: size.w, height: size.h,
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 20px 40px -12px rgba(15, 76, 74, 0.22), 0 2px 6px rgba(15, 76, 74, 0.08)',
        border: '1px solid rgba(15, 76, 74, 0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
        color: '#1a1f1e'
      };

  const chatStarted = messages.length > 0;
  // Logo image fallback flag for the header brand square
  // (we use state-less inline img + onError to swap to sparkle)

  return (
    <div style={shellStyle}>

      {/* Header */}
      <div style={{
        padding: '12px 14px',
        background: '#fff',
        borderBottom: '1px solid #eef1f0',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <BrandSquare />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: TEAL, letterSpacing: -0.1 }}>
            GIST AI Assistant
          </div>
          <div style={{ fontSize: 11, color: '#7a8785', marginTop: 1 }}>
            {streaming ? 'reading figure…' : (currentFigure ? 'Figure interpretation · online' : 'Ready · online')}
          </div>
        </div>
        {streaming ? (
          <button onClick={cancel} style={iconBtn(TEAL)} title="Stop">
            <I.Stop size={12} />
          </button>
        ) : currentFigure?.pendingPrompt ? (
          <button onClick={refresh} style={iconBtn()} title="Re-analyse">
            <I.Refresh size={14} />
          </button>
        ) : null}
        <button onClick={clearAll} style={iconBtn()} title="Clear">
          <I.Trash size={14} />
        </button>
        <button onClick={() => setOpen(false)} style={iconBtn()} title="Close">
          <I.Close size={14} />
        </button>
      </div>

      {/* Context chip — only when a figure is loaded */}
      {currentFigure && (
        <ContextChip ctx={currentFigure} />
      )}

      {/* Body: Empty state OR chat stream */}
      <div ref={scrollerRef} style={{
        flex: 1, overflowY: 'auto',
        background: '#fafbfb'
      }}>
        {!chatStarted ? (
          <Empty
            ctx={currentFigure}
            onAnalyse={interpretFigure}
            onPick={askPick}
          />
        ) : (
          <div style={{ padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m) => (
              <Message key={m.id} m={m} onCopy={() => copy(m.content)} onRetry={refresh} />
            ))}
            {streaming && messages[messages.length - 1]?.role === 'assistant' &&
              !messages[messages.length - 1]?.content && <Thinking />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 12px 12px', background: '#fff', borderTop: '1px solid #eef1f0' }}>
        <div style={{
          border: '1.5px solid #e5e9e8', borderRadius: 11,
          padding: '3px 4px 3px 12px',
          display: 'flex', alignItems: 'flex-end', gap: 4,
          background: '#fff'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={chatStarted ? 'Ask a follow-up…' : 'Ask anything about this figure…'}
            rows={1}
            disabled={streaming}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: 12.5, lineHeight: 1.5, padding: '7px 0',
              fontFamily: 'inherit', color: '#1a1f1e',
              background: 'transparent', minHeight: 20, maxHeight: 100
            }}
          />
          <button
            onClick={() => { const t = input; setInput(''); void sendMessage(t, currentFigure?.pendingImagePath); }}
            disabled={streaming || !input.trim()}
            style={{
              width: 30, height: 30, border: 'none',
              background: (streaming || !input.trim()) ? '#e5e9e8' : TEAL,
              color: '#fff', borderRadius: 8,
              cursor: (streaming || !input.trim()) ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s'
            }}
          >
            <I.Send size={13} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#9aa5a3', marginTop: 5, paddingLeft: 2 }}>
          Shift + Enter for new line
        </div>
      </div>

      {!isMobile && (
        <div
          onMouseDown={startResize}
          title="Drag to resize"
          style={{
            position: 'absolute', top: 0, left: 0, width: 14, height: 14,
            cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, rgba(15,76,74,0.25) 50%, transparent 50%)'
          }}
        />
      )}

      <style>{`
        @keyframes dbgist-pulseA {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @keyframes dbgist-fab-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const iconBtn = (color = '#7a8785'): React.CSSProperties => ({
  width: 28, height: 28, border: 'none', background: 'transparent',
  borderRadius: 7, color, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
});

// ── FAB B (collapsed): teal pill with GIST logo, expands on hover ──────
const FabB: React.FC<{ hasNew?: boolean; onClick: () => void }> = ({ hasNew, onClick }) => {
  const [hover, setHover] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  useEffect(() => { injectFontOnce(); }, []);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed', right: 24, bottom: 24, zIndex: 10000,
        height: 52,
        padding: hover ? '0 18px 0 6px' : 0,
        width: hover ? 'auto' : 52,
        borderRadius: 26,
        background: TEAL, color: '#fff', border: 'none',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: hover ? 10 : 0,
        cursor: 'pointer',
        boxShadow: '0 8px 20px -4px rgba(15,76,74,0.4), 0 2px 4px rgba(15,76,74,0.15)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
        fontSize: 13, fontWeight: 600,
        overflow: 'hidden', whiteSpace: 'nowrap'
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(15,76,74,0.12)'
      }}>
        {logoBroken ? (
          <span style={{ color: TEAL, display: 'inline-flex' }}>
            <I.Sparkle size={20} />
          </span>
        ) : (
          <img
            src="/GIST_gpt.png"
            alt="GIST"
            onError={() => setLogoBroken(true)}
            style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }}
          />
        )}
      </div>
      {hover && (
        <span style={{ letterSpacing: 0.1 }}>
          Ask AI about this figure
        </span>
      )}
      {hasNew && !hover && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 11, height: 11, borderRadius: '50%',
          background: AMBER, border: '2px solid #fff'
        }} />
      )}
    </button>
  );
};

// ── Brand square (32x32 GIST logo with green online dot) ──────────────────
const BrandSquare: React.FC = () => {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0,
      boxShadow: 'inset 0 0 0 1px rgba(15,76,74,0.12)',
      overflow: 'hidden'
    }}>
      {broken ? (
        <span style={{ color: TEAL }}><I.Sparkle size={16} /></span>
      ) : (
        <img
          src="/GIST_gpt.png"
          alt="GIST"
          onError={() => setBroken(true)}
          style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }}
        />
      )}
      <span style={{
        position: 'absolute', bottom: -1, right: -1,
        width: 9, height: 9, borderRadius: '50%',
        background: '#10b981', border: '2px solid #fff'
      }} />
    </div>
  );
};

// ── Context chip (between header and body) ────────────────────────────────
const ContextChip: React.FC<{ ctx: FigureContext }> = ({ ctx }) => (
  <div style={{
    padding: '8px 14px',
    borderBottom: '1px solid #eef1f0',
    background: TEAL_LIGHT,
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11.5
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL_MID }} />
    <span style={{ color: '#4a5957', fontWeight: 500 }}>Reading:</span>
    <span style={{
      fontWeight: 600, color: TEAL, overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      flex: 1, minWidth: 0
    }}>
      {ctx.gene ? `${ctx.gene} · ` : ''}{ctx.analysisType || 'figure'}
    </span>
    <span style={{
      flexShrink: 0,
      fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
      padding: '2px 6px', borderRadius: 4,
      background: '#fff', color: TEAL_MID,
      border: '1px solid rgba(15,76,74,0.15)'
    }}>{labelForAnalysis(ctx.analysisType)}</span>
  </div>
);

// ── Empty state (figure preview + Interpret CTA + suggestions) ────────────
const Empty: React.FC<{
  ctx: FigureContext | null;
  onAnalyse: () => void;
  onPick: (q: string) => void;
}> = ({ ctx, onAnalyse, onPick }) => {
  const suggestions = promptsFor(ctx?.gene, ctx?.analysisType);

  return (
    <div style={{ padding: '20px 16px 16px' }}>
      {ctx && (
        <div style={{
          border: '1px solid #eef1f0', borderRadius: 10,
          padding: 10, background: '#fff', marginBottom: 14
        }}>
          <div style={{
            height: 130, borderRadius: 6, overflow: 'hidden',
            background: '#fafbfb',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {ctx.imageSrc ? (
              <img src={ctx.imageSrc} alt="figure"
                   style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span style={{ fontSize: 11, color: '#9aa5a3' }}>preview unavailable</span>
            )}
          </div>
          <div style={{
            display: 'flex', gap: 8, fontSize: 10.5, color: '#4a5957',
            marginTop: 8, fontFamily: '"JetBrains Mono", monospace'
          }}>
            {ctx.gene && <span style={{ color: TEAL, fontWeight: 600 }}>{ctx.gene}</span>}
            <span style={{ marginLeft: 'auto', color: '#7a8785' }}>{ctx.analysisType}</span>
          </div>
        </div>
      )}

      {ctx ? (
        <button
          onClick={onAnalyse}
          style={{
            width: '100%', padding: '11px 14px',
            background: TEAL, color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 2px 6px rgba(15,76,74,0.25)'
          }}
        >
          <I.Sparkle size={14} /> Interpret this figure
        </button>
      ) : (
        <div style={{
          padding: '14px 16px',
          background: TEAL_LIGHT, borderRadius: 10,
          color: TEAL, fontSize: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.5
        }}>
          Click <b>Analysis</b> on any chart to load it here, or type a question below.
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '14px 0', fontSize: 10.5, color: '#9aa5a3', fontWeight: 500
      }}>
        <div style={{ flex: 1, height: 1, background: '#eef1f0' }} />
        <span style={{ letterSpacing: 0.6 }}>OR ASK</span>
        <div style={{ flex: 1, height: 1, background: '#eef1f0' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            style={{
              textAlign: 'left', padding: '9px 12px',
              background: '#fff', border: '1px solid #eef1f0',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 12, color: '#3f4a49', lineHeight: 1.4,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = TEAL_MID;
              e.currentTarget.style.background = TEAL_LIGHT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#eef1f0';
              e.currentTarget.style.background = '#fff';
            }}
          >
            <span style={{ fontSize: 12, color: TEAL_MID, flexShrink: 0 }}>→</span>
            <span style={{ flex: 1 }}>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────
const Message: React.FC<{ m: ChatMessage; onCopy: () => void; onRetry?: () => void }> = ({ m, onCopy, onRetry }) => {
  if (m.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '82%',
          padding: '8px 12px',
          background: TEAL, color: '#fff',
          borderRadius: '12px 12px 3px 12px',
          fontSize: 12.5, lineHeight: 1.5
        }}>
          {m.image && (
            <div style={{ marginBottom: 6 }}>
              <img src={resolveImageSrc(m.image)} alt="figure"
                   style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6 }} />
            </div>
          )}
          <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: TEAL, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <I.Sparkle size={12} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: '#fff', border: '1px solid #eef1f0',
          borderRadius: '3px 12px 12px 12px',
          padding: '10px 12px',
          fontSize: 12.5, lineHeight: 1.6, color: '#1f2a28'
        }}>
          {m.isStreaming ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {normalize(m.content) || <ThinkingInline />}
            </div>
          ) : (
            <ReactMarkdown components={md as any}>{normalize(m.content) || '…'}</ReactMarkdown>
          )}
        </div>
        {!m.isStreaming && m.content && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, paddingLeft: 2 }}>
            <button onClick={onCopy} style={msgAction()} title="Copy">
              <I.Copy size={11} />
            </button>
            {onRetry && (
              <button onClick={onRetry} style={msgAction()} title="Re-analyse">
                <I.Refresh size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const msgAction = (): React.CSSProperties => ({
  width: 22, height: 22, border: 'none', background: 'transparent',
  borderRadius: 4, color: '#9aa5a3', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
});

// ── Thinking indicator ────────────────────────────────────────────────────
const Thinking: React.FC = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
    <div style={{
      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
      background: TEAL, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <I.Sparkle size={12} />
    </div>
    <div style={{
      background: '#fff', border: '1px solid #eef1f0',
      borderRadius: '3px 12px 12px 12px',
      padding: '10px 12px',
      display: 'flex', gap: 5, alignItems: 'center'
    }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: TEAL_MID,
          animation: `dbgist-pulseA 1.4s ${i * 0.2}s infinite`
        }} />
      ))}
      <span style={{ fontSize: 11, color: '#7a8785', marginLeft: 4 }}>reading figure…</span>
    </div>
  </div>
);

const ThinkingInline: React.FC = () => (
  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{
        width: 5, height: 5, borderRadius: '50%', background: TEAL_MID,
        animation: `dbgist-pulseA 1.4s ${i * 0.2}s infinite`
      }} />
    ))}
    <span style={{ fontSize: 11, color: '#7a8785', marginLeft: 4 }}>reading figure…</span>
  </span>
);

export default DbgistChat;
