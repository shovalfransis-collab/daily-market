import { SectorData } from '../types';

interface Props {
  sectors: SectorData[];
  loading: boolean;
}

function sectorTileColor(pct: number): string {
  const clampedPct = Math.max(-3, Math.min(3, pct));
  if (clampedPct >= 0) {
    const intensity = Math.round(10 + (clampedPct / 3) * 30);
    return `hsl(142, 76%, ${intensity}%)`;
  } else {
    const intensity = Math.round(10 + (Math.abs(clampedPct) / 3) * 30);
    return `hsl(0, 72%, ${intensity}%)`;
  }
}

function SectorTile({ sector }: { sector: SectorData }) {
  const bg = sectorTileColor(sector.changePercent);
  const positive = sector.changePercent >= 0;

  return (
    <div
      className="rounded-lg p-3 flex flex-col items-center justify-center text-center min-h-[80px] transition-all hover:opacity-90 cursor-default"
      style={{ backgroundColor: bg }}
    >
      <p className="text-xs font-medium text-white/90 leading-tight mb-1">{sector.name}</p>
      <p className="text-xs text-white/60">{sector.etf}</p>
      <p className={`text-sm font-medium mt-1 ${positive ? 'text-green-100' : 'text-red-100'}`}>
        {positive ? '+' : ''}{sector.changePercent.toFixed(2)}%
      </p>
    </div>
  );
}

function SkeletonTile() {
  return <div className="rounded-lg bg-muted animate-pulse min-h-[80px]" />;
}

export function SectorHeatmap({ sectors, loading }: Props) {
  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Sector Performance
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {loading
          ? [...Array(11)].map((_, i) => <SkeletonTile key={i} />)
          : sectors.map(s => <SectorTile key={s.etf} sector={s} />)}
      </div>
    </section>
  );
}
