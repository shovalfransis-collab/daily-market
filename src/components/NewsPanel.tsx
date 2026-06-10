import { ExternalLink } from 'lucide-react';
import { NewsItem, NewsletterSummary } from '../types';

interface Props {
  news: NewsItem[];
  loading: boolean;
  summary?: NewsletterSummary | null;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const moodBadge: Record<NewsletterSummary['marketMood'], string> = {
  bullish: 'bg-up/20 text-up border-up/30',
  bearish: 'bg-down/20 text-down border-down/30',
  neutral: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function NewsPanel({ news, loading, summary }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Today's Headlines
      </h3>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {/* Market context banner */}
        {summary && (
          <div className="px-4 py-3 bg-muted/30 flex items-start gap-3">
            <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${moodBadge[summary.marketMood]}`}>
              {summary.marketMood}
            </span>
            <p className="text-sm font-medium text-slate-100 leading-snug">{summary.headline}</p>
          </div>
        )}

        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse flex gap-3">
              <div className="flex-1">
                <div className="h-3.5 bg-muted rounded w-full mb-2" />
                <div className="h-3.5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
              <div className="w-16 h-12 bg-muted rounded-lg shrink-0" />
            </div>
          ))
        ) : news.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">No news available</p>
        ) : (
          news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug group-hover:text-white transition-colors line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">{item.publisher}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-16 h-12 object-cover rounded-lg opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
