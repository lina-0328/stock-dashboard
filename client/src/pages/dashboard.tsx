import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber, formatPercent, returnColor, marketBadge, naverStockUrl } from "@/lib/helpers";

export default function Dashboard() {
  const { data: latestData, isLoading: loadingLatest } = useQuery({
    queryKey: ["/api/signals/latest"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/signals/latest");
      return res.json();
    },
  });


  const { data: topStocks } = useQuery({
    queryKey: ["/api/top-stocks", 20],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/top-stocks?limit=10&days=20");
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



  return (
    <div className="space-y-6">
      {/* 헤더: 기준일 크게 표시 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold" data-testid="text-page-title">순매수 인기종목</h1>
        <span className="text-2xl font-bold font-mono text-primary">
          {latestData?.date || "로딩 중..."}
        </span>
      </div>

      {/* 공통 순매수 종목 리스트 - 헤더 바로 아래 */}
      <Card>
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
                      <th className="px-3 py-2.5 font-medium text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center justify-end gap-1 cursor-help">
                                수익률 <Info className="w-3 h-3 opacity-50" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              신호 당일 종가 → 현재 종가 기준
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </th>
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

      {/* 투자 Tip */}
      <div className="space-y-3">
        <h2 className="text-base font-bold">주식주부 리나의 수급인기종목 투자 Tip!</h2>

        <Card className="border-2 border-emerald-500/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">★</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">핵심 전략 · 코스피 거래대금 1위만 매수</p>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] border-0">최고 효율</Badge>
                </div>
                <p className="text-sm leading-relaxed">
                  그날 코스피 공통 순매수 종목 중 <span className="font-semibold">거래대금 1위 종목 1개만</span> 매수해도
                  시드 <span className="font-semibold">1,273만원</span>으로 수익률 <span className="font-semibold text-emerald-600 dark:text-emerald-400">+11.8%</span>,
                  승률 <span className="font-semibold text-emerald-600 dark:text-emerald-400">66.7%</span> 달성.
                  전체 종목 다 매수하는 것보다 적은 시드로 더 높은 수익률.
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                  <p className="text-xs text-muted-foreground">예시 종목: 삼성전자·SK하이닉스·현대차·두산에너빌리티·LIG넥스원·한화시스템 등 대형주 위주</p>
                  <p className="text-xs text-muted-foreground/60">* 2026.01~04 백테스트 · 등장 익일 시초가 매수 · 21영업일 보유 후 종가 매도 성과</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-3">
          <TipBox num="Tip 1" title="코스피 > 코스닥" desc="코스피 21일 보유 시 승률 58%, 수익률 +5.2%. 코스닥은 41%, +1.9%로 변동성이 훨씬 큼. 안정적인 수익을 원하면 코스피 종목 위주로." type="positive" />
          <TipBox num="Tip 2" title="21영업일이 최적 보유기간" desc="5일·10일보다 21영업일(약 1개월) 보유 시 코스피 승률이 60%에 가까워짐. 단, 21일 이후 추가 보유는 오히려 승률 하락." type="positive" />
          <TipBox num="Tip 3" title="익절/손절 설정 주의" desc="+30% 익절만 느슨하게 설정하는 게 가장 유리. 촘촘한 손절(-5~10%)은 역효과. 코스닥은 대박 종목을 조기에 놓치지 않도록 주의." type="neutral" />
          <TipBox num="Tip 4" title="코스닥 단독 거래대금 1위는 위험" desc="코스닥 거래대금 1위만 선택하면 수익률 -5.0%, 승률 35.6%로 오히려 손실. 에코프로·알테오젠 등 고점 매수 후 급락 사례 다수. 코스닥은 분산 투자." type="negative" />
        </div>
      </div>

      {/* 최다 출현 종목 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">최다 출현 종목</CardTitle>
            <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">최근 20거래일</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">수익률 = 신호 다음날 시초가 → 21영업일 후 종가</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {topStocks?.slice(0, 8).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5" data-testid={`top-stock-${i}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 shrink-0 ${marketBadge(s.market)}`}>
                        {s.market === "KOSPI" ? "KP" : "KQ"}
                      </Badge>
                    </div>
                    {s.firstDate && (
                      <span className="text-[10px] text-muted-foreground">첫 등장 {s.firstDate}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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

function TipBox({ num, title, desc, type }: { num: string; title: string; desc: string; type: "positive" | "negative" | "neutral" }) {
  const colors = {
    positive: "border-l-emerald-500 bg-emerald-500/5",
    negative: "border-l-red-500 bg-red-500/5",
    neutral: "border-l-primary bg-primary/5",
  };
  return (
    <div className={`border-l-2 pl-3 py-2.5 rounded-r-md ${colors[type]}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-mono text-muted-foreground">{num}</span>
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
    </div>
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
