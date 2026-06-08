import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { NewsletterSummary } from '../types';

interface Props {
  summary: NewsletterSummary | null;
  loading: boolean;
}

export function NewsletterSummaryCard({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-3/4 mb-4" />
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-5/6 mb-6" />
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const moodConfig = {
    bullish: { label: 'BULLISH', color: 'text-up bg-up/10 border-up/20', Icon: TrendingUp },
    bearish: { label: 'BEARISH', color: 'text-down bg-down/10 border-down/20', Icon: TrendingDown },
    neutral: { label: 'NEUTRAL', color: 'text-neutral bg-neutral/10 border-neutral/20', Icon: Minus },
  }[summary.marketMood];

  const bulletColor = {
    bullish: 'bg-up',
    bearish: 'bg-down',
    neutral: 'bg-neutral',
  }[summary.marketMood];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-3 mb-3">
        <h2 className="text-2xl font-medium text-slate-100 leading-tight flex-1">
          {summary.headline}
        </h2>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${moodConfig.color}`}>
          <moodConfig.Icon size={11} />
          {moodConfig.label}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-5 leading-relaxed">{summary.marketAnalysis}</p>

      <ul className="grid sm:grid-cols-2 gap-2">
        {summary.keyPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${bulletColor}`} />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
