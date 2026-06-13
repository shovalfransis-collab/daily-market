import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { FinancialMetrics } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  metrics: FinancialMetrics | null;
}

function fmtBig(n: number): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function buildSystemPrompt(symbol: string, name: string, price: number, changePct: number, m: FinancialMetrics | null): string {
  const lines = [
    `You are a sharp, concise financial analyst assistant. The user is viewing ${name} (${symbol}).`,
    `Price: $${price.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}% today)`,
  ];
  if (m) {
    if (m.marketCap)         lines.push(`Market Cap: ${fmtBig(m.marketCap)}`);
    if (m.pe)                lines.push(`P/E (TTM): ${m.pe.toFixed(1)}`);
    if (m.forwardPE)         lines.push(`Forward P/E: ${m.forwardPE.toFixed(1)}`);
    if (m.eps)               lines.push(`EPS (TTM): $${m.eps.toFixed(2)}`);
    if (m.epsForward)        lines.push(`Forward EPS: $${m.epsForward.toFixed(2)}`);
    if (m.revenue)           lines.push(`Revenue (TTM): ${fmtBig(m.revenue)}`);
    if (m.revenueGrowth)     lines.push(`Revenue Growth YoY: ${(m.revenueGrowth * 100).toFixed(1)}%`);
    if (m.netIncome)         lines.push(`Net Income: ${fmtBig(m.netIncome)}`);
    if (m.grossMargin)       lines.push(`Gross Margin: ${(m.grossMargin * 100).toFixed(1)}%`);
    if (m.operatingMargin)   lines.push(`Operating Margin: ${(m.operatingMargin * 100).toFixed(1)}%`);
    if (m.netMargin)         lines.push(`Net Margin: ${(m.netMargin * 100).toFixed(1)}%`);
    if (m.freeCashFlow)      lines.push(`Free Cash Flow: ${fmtBig(m.freeCashFlow)}`);
    if (m.debtToEquity)      lines.push(`Debt/Equity: ${m.debtToEquity.toFixed(2)}`);
    if (m.beta)              lines.push(`Beta: ${m.beta.toFixed(2)}`);
    if (m.week52High)        lines.push(`52W High: $${m.week52High.toFixed(2)}`);
    if (m.week52Low)         lines.push(`52W Low: $${m.week52Low.toFixed(2)}`);
    if (m.sector)            lines.push(`Sector: ${m.sector}`);
    if (m.industry)          lines.push(`Industry: ${m.industry}`);
    if (m.targetMean)        lines.push(`Analyst Target (mean): $${m.targetMean.toFixed(2)}`);
    if (m.recommendationKey) lines.push(`Analyst Consensus: ${m.recommendationKey}`);
    if (m.annualRevenue?.length)
      lines.push(`Annual Revenue: ${m.annualRevenue.map(r => `${r.date}: ${fmtBig(r.value)}`).join(', ')}`);
    if (m.annualNetIncome?.length)
      lines.push(`Annual Net Income: ${m.annualNetIncome.map(r => `${r.date}: ${fmtBig(r.value)}`).join(', ')}`);
  }
  lines.push(`Answer concisely. Use data above when relevant. Never fabricate numbers. If data isn't available, say so. Keep answers under 200 words unless asked for more.`);
  return lines.join('\n');
}

const SUGGESTIONS = [
  'What is the P/E ratio?',
  'How is revenue trending?',
  'Is this stock overvalued?',
  'What do analysts think?',
];

export function AIChatBox({ symbol, name, price, changePct, metrics }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [symbol]);

  // Only auto-scroll the chat container when there are messages
  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildSystemPrompt(symbol, name, price, changePct, metrics),
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data?.content?.[0]?.text ?? data?.error ?? 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Bot size={14} className="text-violet-400" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">AI Assistant</h3>
        <span className="text-[10px] text-violet-400/60 border border-violet-400/20 px-1.5 py-0.5 rounded-full">Beta</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4 min-h-[120px] max-h-[380px] overflow-y-auto">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-4 gap-3">
              <Bot size={28} className="text-violet-400/50" />
              <p className="text-xs text-muted-foreground text-center">
                Ask anything about <span className="text-slate-300 font-medium">{name}</span>
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-slate-300 hover:border-violet-400/40 hover:text-violet-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-slate-700 border border-border'}`}>
                {m.role === 'user' ? <User size={12} className="text-violet-400" /> : <Bot size={12} className="text-slate-400" />}
              </div>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-500/15 border border-violet-500/20 text-slate-200'
                  : 'bg-muted/60 border border-border text-slate-300'
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-700 border border-border flex items-center justify-center shrink-0">
                <Bot size={12} className="text-slate-400" />
              </div>
              <div className="bg-muted/60 border border-border rounded-xl px-3 py-2 flex items-center gap-1.5">
                <Loader2 size={12} className="text-violet-400 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border flex gap-2 p-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Ask about ${symbol}…`}
            disabled={loading}
            className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-muted-foreground border border-border focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
