import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercent, returnColor, marketBadge, naverStockUrl } from "@/lib/helpers";
import { useState } from "react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

export default function History() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [marketFilter, setMarketFilter] = useState<string>("all");

  const { data: dates, isLoading: loadingDates } = useQuery({
    queryKey: ["/api/dates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dates");
      return res.json();
    },
  });

  // Set initial date
  const activeDate = selectedDate || dates?.[0] || "";

  const { data: signals, isLoading: loadingSignals } = useQuery({
    queryKey: ["/api/signals", activeDate],
    queryFn: async () => {
      if (!activeDate) return [];
      const res = await apiRequest("GET", `/api/signals/${activeDate}`);
      return res.json();
    },
    enabled: !!activeDate,
  });

  const { data: dailySummary } = useQuery({
    queryKey: ["/api/daily-summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/daily-summary");
      return res.json();
    },
  });

  const filtered = signals?.filter((s: any) =>
    marketFilter === "all" ? true : s.market === marketFilter
  ) || [];

  const currentIdx = dates?.indexOf(activeDate) ?? -1;
  const canPrev = currentIdx < (dates?.length ?? 0) - 1;
  const canNext = currentIdx > 0;

  const goDate = (dir: number) => {
    if (!dates) return;
    const newIdx = currentIdx + dir;
    if (newIdx >= 0 && newIdx < dates.length) {
      setSelectedDate(dates[newIdx]);
    }
  };

  // Date stats
  const dayStats = dailySummary?.find((d: any) => d.date === activeDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" data-testid="text-history-title">히스토리 아카이브</h1>
        <p className="text-sm text-muted-foreground mt-1">
          2026년 1월 ~ 현재, 일자별 외국인·기관 공통 순매수 종목
        </p>
      </div>

      {/* Date selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goDate(1)}
            disabled={!canPrev}
            className="p-1.5 rounded-md hover:bg-muted/50 disabled:opacity-30 transition-colors"
            data-testid="button-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <Select value={activeDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-date">
              <SelectValue placeholder="날짜 선택" />
            </SelectTrigger>
            <SelectContent>
              {dates?.map((d: string) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => goDate(-1)}
            disabled={!canNext}
            className="p-1.5 rounded-md hover:bg-muted/50 disabled:opacity-30 transition-colors"
            data-testid="button-next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-[120px] h-9 text-sm" data-testid="select-market">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="KOSPI">코스피</SelectItem>
            <SelectItem value="KOSDAQ">코스닥</SelectItem>
          </SelectContent>
        </Select>

        {dayStats && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>총 <span className="font-mono font-medium text-foreground">{dayStats.total}</span>종목</span>
            <span>코스피 <span className="font-mono font-medium text-foreground">{dayStats.kospi}</span></span>
            <span>코스닥 <span className="font-mono font-medium text-foreground">{dayStats.kosdaq}</span></span>
          </div>
        )}
      </div>

      {/* Signals table */}
      <Card>
        <CardContent className="p-0">
          {loadingSignals ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              해당 날짜에 데이터가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium w-8">#</th>
                    <th className="px-3 py-2.5 font-medium">종목명</th>
                    <th className="px-3 py-2.5 font-medium text-right">당일 종가</th>
                    <th className="px-3 py-2.5 font-medium text-right">현재가</th>
                    <th className="px-3 py-2.5 font-medium text-right">수익률</th>
                    <th className="px-3 py-2.5 font-medium text-right hidden md:table-cell">외국인</th>
                    <th className="px-3 py-2.5 font-medium text-right hidden md:table-cell">기관</th>
                    <th className="px-3 py-2.5 font-medium text-right hidden sm:table-cell">합산</th>
                    <th className="px-3 py-2.5 font-medium text-right hidden lg:table-cell">출현</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any, i: number) => (
                    <tr key={s.code} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`history-row-${s.code}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={naverStockUrl(s.code)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {s.name}
                            <ExternalLink className="w-3 h-3 opacity-30" />
                          </a>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${marketBadge(s.market)}`}>
                            {s.market}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{formatNumber(s.priceAtDate)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{formatNumber(s.currentPrice)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono text-xs font-medium ${returnColor(s.returnPct)}`}>
                        {formatPercent(s.returnPct)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {formatNumber(s.frgnAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {formatNumber(s.instAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs hidden sm:table-cell">
                        {formatNumber(s.totalAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground hidden lg:table-cell">
                        {s.freqDays}일
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar heatmap - simplified */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">일자별 종목 수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {dailySummary?.slice().reverse().map((d: any) => {
              const intensity = Math.min(d.total / 16, 1);
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`w-7 h-7 rounded text-[9px] font-mono flex items-center justify-center transition-all
                    ${d.date === activeDate ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50"}
                  `}
                  style={{
                    backgroundColor: `hsl(215 70% 48% / ${0.1 + intensity * 0.6})`,
                    color: intensity > 0.5 ? "white" : "hsl(var(--foreground))",
                  }}
                  title={`${d.date}: ${d.total}종목`}
                  data-testid={`heatmap-${d.date}`}
                >
                  {d.total}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            각 칸 = 1거래일, 숫자 = 공통 순매수 종목 수 (진할수록 많음)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
