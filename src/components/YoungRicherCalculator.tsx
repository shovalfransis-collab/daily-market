import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, TrendingUp, ChevronDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Props {
  onBack: () => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',         rate: 1 },
  { code: 'EUR', symbol: '€',   name: 'Euro',              rate: 0.92 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',     rate: 0.79 },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',      rate: 149.5 },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan',      rate: 7.24 },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', rate: 1.53 },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',   rate: 1.36 },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',       rate: 0.90 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar',  rate: 7.82 },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',  rate: 1.34 },
  { code: 'ILS', symbol: '₪',   name: 'Israeli Shekel',    rate: 3.70 },
] as const;

type Currency = typeof CURRENCIES[number];

function fmtMoney(n: number, sym: string): string {
  if (n >= 1_000_000_000) return `${sym}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${sym}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `${sym}${(n / 1_000).toFixed(1)}K`;
  return `${sym}${n.toFixed(0)}`;
}

function fmtAxis(n: number, sym: string): string {
  if (n >= 1_000_000_000) return `${sym}${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${sym}${(n / 1_000).toFixed(0)}K`;
  return `${sym}${n.toFixed(0)}`;
}

function calcFV(principal: number, monthlyPmt: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal + monthlyPmt * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * growth + monthlyPmt * (growth - 1) / monthlyRate;
}

function SliderInput({
  label, value, min, max, step, display, parse, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; display: (v: number) => string;
  parse: (s: string) => number; onChange: (v: number) => void;
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(display(value));
  }, [value, focused, display]);

  const handleFocus = () => {
    setFocused(true);
    setText(String(value));
  };

  const handleBlur = () => {
    setFocused(false);
    const n = parse(text);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    else setText(display(value));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    const n = parse(e.target.value);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-slate-400">{label}</span>
        <input
          type="text"
          value={focused ? text : display(value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleTextChange}
          className="text-sm font-semibold text-slate-100 bg-muted border border-border rounded px-2 py-0.5
            focus:border-up outline-none text-right w-28 transition-colors"
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-up [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">{display(min)}</span>
        <span className="text-xs text-slate-600">{display(max)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${accent ? 'text-up' : 'text-slate-200'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function CurrencySelector({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border
          text-sm text-slate-300 hover:bg-[#1e1e2e] transition-colors"
      >
        <span className="font-mono font-bold text-up">{currency.symbol}</span>
        <span>{currency.code}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl
          min-w-[200px] overflow-hidden">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => { onChange(c); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left
                ${c.code === currency.code ? 'text-up bg-muted' : 'text-slate-300'}`}
            >
              <span className="font-mono w-6 text-center font-bold">{c.symbol}</span>
              <span className="font-medium">{c.code}</span>
              <span className="text-slate-500 text-xs ml-auto">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function YoungRicherCalculator({ onBack }: Props) {
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [startAge, setStartAge] = useState(20);
  const [retireAge, setRetireAge] = useState(60);
  const [initialCapital, setInitialCapital] = useState(100_000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1_000);
  const [annualReturn, setAnnualReturn] = useState(12);

  const handleCurrencyChange = (newCur: Currency) => {
    const ratio = newCur.rate / currency.rate;
    setInitialCapital(v => Math.round(v * ratio / 100) * 100);
    setMonthlyInvestment(v => Math.round(v * ratio / 10) * 10);
    setCurrency(newCur);
  };

  const sym = currency.symbol;
  const fmt = (n: number) => fmtMoney(n, sym);

  const years = Math.max(0, retireAge - startAge);
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = years * 12;

  const capitalMax = Math.round(1_000_000 * currency.rate / 100) * 100;
  const monthlyMax = Math.round(10_000 * currency.rate / 10) * 10;
  const capitalStep = Math.max(1, Math.round(5_000 * currency.rate / 100) * 100);
  const monthlyStep = Math.max(1, Math.round(50 * currency.rate / 10) * 10);

  const finalValue = useMemo(
    () => calcFV(initialCapital, monthlyInvestment, monthlyRate, totalMonths),
    [initialCapital, monthlyInvestment, monthlyRate, totalMonths],
  );

  const totalInvested = initialCapital + monthlyInvestment * totalMonths;
  const totalGains = finalValue - totalInvested;
  const multiplier = totalInvested > 0 ? finalValue / totalInvested : 0;

  const chartData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= years; y++) {
      const months = y * 12;
      const value = calcFV(initialCapital, monthlyInvestment, monthlyRate, months);
      const invested = initialCapital + monthlyInvestment * months;
      data.push({ age: startAge + y, value: Math.round(value), invested: Math.round(invested) });
    }
    return data;
  }, [startAge, years, initialCapital, monthlyInvestment, monthlyRate]);

  const handleStartAge = (v: number) => {
    setStartAge(v);
    if (v >= retireAge) setRetireAge(v + 1);
  };

  const handleRetireAge = (v: number) => {
    setRetireAge(v);
    if (v <= startAge) setStartAge(v - 1);
  };

  const parseAge = (s: string) => Math.round(parseFloat(s));
  const parsePct = (s: string) => parseFloat(s.replace('%', ''));
  const parseMoney = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));

  return (
    <div className="min-h-screen bg-background text-slate-200">
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-slate-300 hover:bg-[#1e1e2e] transition-colors shrink-0"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-medium text-slate-100 tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-up shrink-0" />
              The Younger The Richer Calculator
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Compound interest — the 8th wonder of the world
            </p>
          </div>
          <CurrencySelector currency={currency} onChange={handleCurrencyChange} />
        </header>

        {/* How it works */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-base font-medium text-slate-100 mb-2">How It Works</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Every dollar you invest earns returns, and those returns earn their own returns — that's compounding. Starting
            at <strong className="text-slate-300">age {startAge}</strong> instead of{' '}
            <strong className="text-slate-300">age {Math.min(startAge + 10, retireAge - 1)}</strong> isn't just 10 extra
            years of contributions; it's 10 extra years of exponential growth on everything you already accumulated. Time in
            the market is the single most powerful variable — more than rate of return, more than contribution size.
          </p>
          <div className="rounded-lg bg-muted border border-border px-4 py-3 font-mono text-sm">
            <p className="text-slate-300">
              <span className="text-up font-bold">FV</span>
              {' = P × (1 + r/12)'}
              <sup>12t</sup>
              {' + PMT × [(1 + r/12)'}
              <sup>12t</sup>
              {' − 1] / (r/12)'}
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              <span className="text-slate-400">P</span> = initial capital &nbsp;·&nbsp;
              <span className="text-slate-400">r</span> = annual return rate &nbsp;·&nbsp;
              <span className="text-slate-400">t</span> = years investing &nbsp;·&nbsp;
              <span className="text-slate-400">PMT</span> = monthly investment
            </p>
          </div>
        </div>

        {/* Inputs + Summary */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* Sliders */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-medium text-slate-100 mb-5">Your Inputs</h2>
            <div className="space-y-6">
              <SliderInput
                label="Starting Age" value={startAge} min={15} max={70} step={1}
                display={v => `${v} yrs`} parse={parseAge} onChange={handleStartAge}
              />
              <SliderInput
                label="Retirement Age" value={retireAge} min={Math.min(startAge + 1, 90)} max={90} step={1}
                display={v => `${v} yrs`} parse={parseAge} onChange={handleRetireAge}
              />
              <SliderInput
                label="Initial Capital" value={initialCapital} min={0} max={capitalMax} step={capitalStep}
                display={fmt} parse={parseMoney} onChange={setInitialCapital}
              />
              <SliderInput
                label="Monthly Investment" value={monthlyInvestment} min={0} max={monthlyMax} step={monthlyStep}
                display={fmt} parse={parseMoney} onChange={setMonthlyInvestment}
              />
              <SliderInput
                label="Annual Return" value={annualReturn} min={1} max={30} step={0.5}
                display={v => `${v}%`} parse={parsePct} onChange={setAnnualReturn}
              />
            </div>
          </div>

          {/* Results */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
            <h2 className="text-base font-medium text-slate-100 mb-5">Projection</h2>

            <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
              <p className="text-sm text-slate-500 mb-1">Portfolio at age {retireAge}</p>
              <p className="text-5xl font-bold text-up tracking-tight">{fmt(finalValue)}</p>
              <p className="text-sm text-slate-500 mt-2">
                after <span className="text-slate-300 font-medium">{years} years</span> of investing
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total Invested" value={fmt(totalInvested)} />
              <Stat label="Total Gains" value={fmt(totalGains)} accent />
              <Stat label="Money Multiplier" value={`${multiplier.toFixed(1)}×`} accent />
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-slate-400 leading-relaxed">
              Every <span className="text-slate-200">{sym}1</span> put in at age{' '}
              <span className="text-slate-200">{startAge}</span> becomes{' '}
              <span className="text-up font-medium">
                {fmt(Math.pow(1 + monthlyRate, totalMonths))}
              </span>{' '}
              by age <span className="text-slate-200">{retireAge}</span>. Your gains are{' '}
              <span className="text-up font-medium">
                {totalInvested > 0 ? ((totalGains / totalInvested) * 100).toFixed(0) : 0}%
              </span>{' '}
              of final portfolio value.
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-medium text-slate-100 mb-1">Net Worth by Age</h2>
          <p className="text-xs text-slate-500 mb-4">
            Green area = portfolio value &nbsp;·&nbsp; Gray area = amount actually invested &nbsp;·&nbsp; Gap between them = compound gains
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 16 }}>
              <defs>
                <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis
                dataKey="age"
                stroke="#334155"
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Age', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                stroke="#334155"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={n => fmtAxis(n, sym)}
                width={72}
              />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid #1e2535', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                formatter={(value: number, name: string) => [
                  fmt(value),
                  name === 'value' ? 'Portfolio Value' : 'Amount Invested',
                ]}
                labelFormatter={label => `Age ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                formatter={name => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    {name === 'value' ? 'Portfolio Value' : 'Amount Invested'}
                  </span>
                )}
              />
              <Area
                type="monotone" dataKey="invested" name="invested"
                stroke="#475569" strokeWidth={1.5}
                fill="url(#gradInvested)"
              />
              <Area
                type="monotone" dataKey="value" name="value"
                stroke="#22c55e" strokeWidth={2}
                fill="url(#gradValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border mt-4">
          Assumes monthly compounding · Exchange rates approximate · Past performance not indicative of future results
        </footer>
      </div>
    </div>
  );
}
