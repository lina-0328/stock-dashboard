import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 일자별 외국인+기관 공통 순매수 종목
export const signals = sqliteTable("signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),           // 신호일 (YYYY-MM-DD)
  market: text("market").notNull(),        // KOSPI | KOSDAQ
  code: text("code").notNull(),            // 종목 코드
  name: text("name").notNull(),            // 종목명
  frgnAmount: integer("frgn_amount"),      // 외국인 순매수 금액 (백만원)
  instAmount: integer("inst_amount"),      // 기관 순매수 금액 (백만원)
  totalAmount: integer("total_amount"),    // 합산 거래대금 (백만원)
  priceAtDate: integer("price_at_date"),   // 당일 종가
  currentPrice: integer("current_price"),  // 현재가
  returnPct: real("return_pct"),           // 현재가 기준 수익률
  freqDays: integer("freq_days"),          // 관측 기간 내 출현 일수
});

// 백테스트 거래
export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  signalDate: text("signal_date").notNull(),
  buyDate: text("buy_date").notNull(),
  sellDate: text("sell_date").notNull(),
  isOpen: integer("is_open").default(0),   // 1=미청산
  code: text("code").notNull(),
  name: text("name").notNull(),
  market: text("market").notNull(),
  buyPrice: integer("buy_price"),
  sellPrice: integer("sell_price"),
  retPct: real("ret_pct"),
  profit1share: integer("profit_1share"),
  invest1share: integer("invest_1share"),
});

// 종목 뉴스
export const news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  date: text("date"),
  source: text("source"),
  fetchedAt: text("fetched_at").notNull(), // fetch 시점
});

// 메타 정보 (마지막 업데이트 등)
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const insertSignalSchema = createInsertSchema(signals).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true });
export const insertNewsSchema = createInsertSchema(news).omit({ id: true });

export type Signal = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
