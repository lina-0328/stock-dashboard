import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPercent, formatMoney, returnColor, marketBadge } from "@/lib/helpers";
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "1개월", value: "20" },
  { label: "3개월", value: "63" },
  { label: "전체", value: "0" },
];

export default function Backtest() {
  const [market, setMarket] = useState("KOSPI");
  const [period, setPeriod] = useState("63"); // default: 코스피 3개월(63거래일)

  const daysParam = parseInt(period) || 0;
  const daysQuery = daysParam > 0 ? `&days=${daysParam}` : "";

  const { data: summary } = useQuery({
    queryKey: ["/api/backtest/summary", period],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/backtest/summary?days=${daysParam}`);
      return res.json();
    },
  });

  const { data: trades } = useQuery({
    queryKey: ["/api/backtest/trades", market, period],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/backtest/trades?market=${market}${daysQuery}`);
      return res.json();
    },
  });

  const current = summary?.find((s: any) => s.market === market);

  // Distribution chart data
  const distribution = useMemo(() => {
    if (!trades) return [];
    const buckets = [
      { range: "<-20%", min: -Infinity, max: -20, count: 0 },
      { range: "-20~-10%", min: -20, max: -10, count: 0 },
      { range: "-10~0%", min: -10, max: 0, count: 0 },
      { range: "0~10%", min: 0, max: 10, count: 0 },
      { range: "10~20%", min: 10, max: 20, count: 0 },
      { range: "20~30%", min: 20, max: 30, count: 0 },
      { range: ">30%", min: 30, max: Infinity, count: 0 },
    ];
    trades.forEach((t: any) => {
      const r = t.retPct ?? 0;
      const b = buckets.find(b => r >= b.min && r < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [trades]);

  // Top 10 profit and loss
  const top10 = useMemo(() => {
    if (!trades) return { winners: [], losers: [] };
    const sorted = [...trades].sort((a: any, b: any) => (b.profit1share ?? 0) - (a.profit1share ?? 0));
    return {
      winners: sorted.slice(0, 10),
      losers: sorted.slice(-10).reverse(),
    };
  }, [trades]);

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || "전체";

  // 날짜 범위 표시 문자열 (summary의 첫 번째 항목 기준)
  const dateRangeInfo = useMemo(() => {
    if (!summary || summary.length === 0) return null;
    const s = summary[0];
    if (!s.dateFrom || !s.dateTo) return null;
    const fmt = (d: string) => d.slice(2).replace(/-/g, "."); // 2026-01-02 → 26.01.02
    return `${fmt(s.dateFrom)} ~ ${fmt(s.dateTo)}`;
  }, [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" data-testid="text-backtest-title">수익률 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">
          등장 익일 시초가로 1주씩 매수, 21영업일(1개월) 보유 후 종가 매도 기준
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Market selector */}
        <Tabs value={market} onValueChange={setMarket}>
          <TabsList data-testid="market-tabs">
            <TabsTrigger value="KOSPI">코스피</TabsTrigger>
            <TabsTrigger value="KOSDAQ">코스닥</TabsTrigger>
            <TabsTrigger value="전체">전체</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period selector */}
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList data-testid="period-tabs">
            {PERIOD_OPTIONS.map(opt => (
              <TabsTrigger key={opt.value} value={opt.value}>{opt.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 날짜 범위 표시 */}
        {dateRangeInfo && (
          <span className="text-xs text-muted-foreground font-mono">
            {dateRangeInfo}
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="총 거래" value={current ? `${current.totalTrades}건` : "-"} sub={periodLabel} />
        <StatCard label="승률" value={current ? `${current.winRate}%` : "-"} accent={current?.winRate > 50 ? "text-emerald-500" : "text-red-500"} sub={periodLabel} />
        <StatCard label="평균 수익률" value={current ? formatPercent(current.avgReturn) : "-"} accent={returnColor(current?.avgReturn)} sub={periodLabel} />
        <StatCard label="총 손익" value={current ? formatMoney(current.totalPnl) : "-"} accent={returnColor(current?.totalPnl)} sub={periodLabel} />
      </div>

      {/* Distribution chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">수익률 분포 · {periodLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="종목 수" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.min >= 0
                        ? "hsl(160 55% 45%)"
                        : "hsl(0 72% 55%)"
                      }
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top winners and losers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-emerald-500">수익 TOP 10</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TradeTable trades={top10.winners} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-red-500">손실 TOP 10</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TradeTable trades={top10.losers} />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function StatCard({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-bold font-mono ${accent || ""}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub} 기준</p>}
      </CardContent>
    </Card>
  );
}

function TradeTable({ trades }: { trades: any[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="px-4 py-2 font-medium">종목</th>
          <th className="px-2 py-2 font-medium">날짜</th>
          <th className="px-2 py-2 font-medium text-right">수익률</th>
          <th className="px-4 py-2 font-medium text-right">손익</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t: any, i: number) => (
          <tr key={i} className="border-b border-border/50">
            <td className="px-4 py-2">
              <div className="flex items-center gap-1">
                <span className="font-medium">{t.name}</span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${marketBadge(t.market)}`}>
                  {t.market === "KOSPI" ? "KP" : "KQ"}
                </Badge>
              </div>
            </td>
            <td className="px-2 py-2 text-muted-foreground font-mono">{t.signalDate?.slice(5)}</td>
            <td className={`px-2 py-2 text-right font-mono font-medium ${returnColor(t.retPct)}`}>
              {formatPercent(t.retPct)}
            </td>
            <td className={`px-4 py-2 text-right font-mono ${returnColor(t.profit1share)}`}>
              {t.profit1share != null ? `${(t.profit1share / 10000).toFixed(1)}만` : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


