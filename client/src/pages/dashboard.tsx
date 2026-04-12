import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, BarChart3, ExternalLink } from "lucide-react";
import { formatNumber, formatPercent, returnColor, marketBadge, naverStockUrl } from "@/lib/helpers";

export default function Dashboard() {
  const { data: latestData, isLoading: loadingLatest } = useQuery({
    queryKey: ["/api/signals/latest"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/signals/latest");
      return res.json();
    },
  });

  const { data: summary } = useQuery({
    queryKey: ["/api/backtest/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/backtest/summary");
      return res.json();
    },
  });

  const { data: topStocks } = useQuery({
    queryKey: ["/api/top-stocks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/top-stocks?limit=10");
      return res.json();
    },
  });

  const { data: metaInfo } = useQuery({
    queryKey: ["/api/meta"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meta");
      return res.json();
    },
  });

  const allSummary = summary?.find((s: any) => s.market === "전체");
  const kospiSummary = summary?.find((s: any) => s.market === "KOSPI");
  const kosdaqSummary = summary?.find((s: any) => s.market === "KOSDAQ");

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold" data-testid="text-page-title">오늘의 순매수 종목</h1>
        <p className="text-sm text-muted-foreground">
          기준일: {latestData?.date || "로딩 중..."} · 데이터 범위: {metaInfo?.dataRange || "-"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="21영업일 승률"
          value={allSummary ? `${allSummary.winRate}%` : "-"}
          sub="전체 기준"
          icon={<TrendingUp className="w-4 h-4" />}
          accent="text-emerald-500"
        />
        <KpiCard
          label="평균 수익률"
          value={allSummary ? formatPercent(allSummary.avgReturn) : "-"}
          sub="21영업일 보유"
          icon={<BarChart3 className="w-4 h-4" />}
          accent={allSummary?.avgReturn > 0 ? "text-emerald-500" : "text-red-500"}
        />
        <KpiCard
          label="분석 종목 수"
          value={allSummary ? `${allSummary.totalTrades}건` : "-"}
          sub="1월~4월"
          icon={<Users className="w-4 h-4" />}
          accent="text-primary"
        />
        <KpiCard
          label="오늘 종목"
          value={latestData?.stocks ? `${latestData.stocks.length}개` : "-"}
          sub={latestData?.date || ""}
          icon={<TrendingDown className="w-4 h-4" />}
          accent="text-primary"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main table - today's stocks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">공통 순매수 종목</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLatest ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">종목</th>
                      <th className="px-3 py-2.5 font-medium text-right">당일가</th>
                      <th className="px-3 py-2.5 font-medium text-right">현재가</th>
                      <th className="px-3 py-2.5 font-medium text-right">수익률</th>
                      <th className="px-3 py-2.5 font-medium text-right hidden sm:table-cell">거래대금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestData?.stocks?.map((s: any) => (
                      <tr key={s.code} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-stock-${s.code}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={naverStockUrl(s.code)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {s.name}
                              <ExternalLink className="w-3 h-3 opacity-40" />
                            </a>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${marketBadge(s.market)}`}>
                              {s.market}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs">
                          {formatNumber(s.priceAtDate)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs">
                          {formatNumber(s.currentPrice)}
                        </td>
                        <td className={`px-3 py-3 text-right font-mono text-xs font-medium ${returnColor(s.returnPct)}`}>
                          {formatPercent(s.returnPct)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">
                          {formatNumber(s.totalAmount)}백만
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Market comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">시장별 성과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MarketStat label="KOSPI" data={kospiSummary} />
              <div className="border-t border-border" />
              <MarketStat label="KOSDAQ" data={kosdaqSummary} />
            </CardContent>
          </Card>

          {/* Top stocks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">최다 출현 종목</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {topStocks?.slice(0, 8).map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5" data-testid={`top-stock-${i}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 ${marketBadge(s.market)}`}>
                        {s.market === "KOSPI" ? "KP" : "KQ"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono ${returnColor(s.avgReturn)}`}>
                        {s.avgReturn != null ? formatPercent(s.avgReturn) : "-"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{s.count}회</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <Card data-testid={`kpi-${label}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <span className={`${accent} opacity-60`}>{icon}</span>
        </div>
        <div className={`text-lg font-bold font-mono ${accent}`}>{value}</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function MarketStat({ label, data }: { label: string; data: any }) {
  if (!data) return <Skeleton className="h-16" />;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={marketBadge(label)}>{label}</Badge>
        <span className="text-xs text-muted-foreground">{data.totalTrades}건</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">승률</p>
          <p className="font-mono text-sm font-semibold">{data.winRate}%</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">평균 수익률</p>
          <p className={`font-mono text-sm font-semibold ${returnColor(data.avgReturn)}`}>
            {formatPercent(data.avgReturn)}
          </p>
        </div>
      </div>
    </div>
  );
}
