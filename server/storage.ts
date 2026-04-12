import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { signals, trades, news, meta, type Signal, type Trade, type News, type InsertSignal, type InsertTrade, type InsertNews } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Auto-create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    market TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    frgn_amount INTEGER,
    inst_amount INTEGER,
    total_amount INTEGER,
    price_at_date INTEGER,
    current_price INTEGER,
    return_pct REAL,
    freq_days INTEGER
  );
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_date TEXT NOT NULL,
    buy_date TEXT NOT NULL,
    sell_date TEXT NOT NULL,
    is_open INTEGER DEFAULT 0,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    market TEXT NOT NULL,
    buy_price INTEGER,
    sell_price INTEGER,
    ret_pct REAL,
    profit_1share INTEGER,
    invest_1share INTEGER
  );
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    date TEXT,
    source TEXT,
    fetched_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_signals_date ON signals(date);
  CREATE INDEX IF NOT EXISTS idx_signals_code ON signals(code);
  CREATE INDEX IF NOT EXISTS idx_trades_signal ON trades(signal_date);
  CREATE INDEX IF NOT EXISTS idx_news_code ON news(code);
`);

export interface IStorage {
  // Signals
  getLatestSignals(): Signal[];
  getSignalsByDate(date: string): Signal[];
  getSignalDates(): string[];
  getSignalsByCode(code: string): Signal[];
  getTopStocks(limit: number): { name: string; market: string; count: number; avgReturn: number | null }[];
  insertSignals(data: InsertSignal[]): void;

  // Trades
  getTradesSummary(): { market: string; totalTrades: number; winRate: number; avgReturn: number; totalPnl: number }[];
  getTradesByMarket(market?: string): Trade[];
  insertTrades(data: InsertTrade[]): void;

  // News
  getNewsByCode(code: string): News[];
  getLatestNews(limit: number): News[];
  insertNews(data: InsertNews[]): void;
  clearNewsForCode(code: string): void;

  // Meta
  getMeta(key: string): string | null;
  setMeta(key: string, value: string): void;

  // Stats
  getDailySummary(): { date: string; total: number; kospi: number; kosdaq: number }[];
}

export class DatabaseStorage implements IStorage {
  getLatestSignals(): Signal[] {
    const latest = db.select({ date: signals.date })
      .from(signals)
      .orderBy(desc(signals.date))
      .limit(1)
      .get();
    if (!latest) return [];
    return db.select().from(signals).where(eq(signals.date, latest.date)).orderBy(desc(signals.totalAmount)).all();
  }

  getSignalsByDate(date: string): Signal[] {
    return db.select().from(signals).where(eq(signals.date, date)).orderBy(desc(signals.totalAmount)).all();
  }

  getSignalDates(): string[] {
    const rows = db.selectDistinct({ date: signals.date }).from(signals).orderBy(desc(signals.date)).all();
    return rows.map(r => r.date);
  }

  getSignalsByCode(code: string): Signal[] {
    return db.select().from(signals).where(eq(signals.code, code)).orderBy(desc(signals.date)).all();
  }

  getTopStocks(limit: number) {
    const rows = db.all(sql`
      SELECT name, market, COUNT(*) as count, ROUND(AVG(return_pct), 2) as avg_return
      FROM signals GROUP BY code, name, market ORDER BY count DESC LIMIT ${limit}
    `) as any[];
    return rows.map(r => ({ name: r.name, market: r.market, count: r.count, avgReturn: r.avg_return }));
  }

  insertSignals(data: InsertSignal[]) {
    for (const d of data) {
      db.insert(signals).values(d).run();
    }
  }

  getTradesSummary() {
    const markets = ['전체', 'KOSPI', 'KOSDAQ'];
    return markets.map(m => {
      const where = m === '전체' ? sql`1=1` : sql`market = ${m}`;
      const row = db.get(sql`
        SELECT COUNT(*) as total, 
               ROUND(AVG(CASE WHEN ret_pct > 0 THEN 1.0 ELSE 0.0 END) * 100, 1) as win_rate,
               ROUND(AVG(ret_pct), 2) as avg_return,
               SUM(profit_1share) as total_pnl
        FROM trades WHERE ${where}
      `) as any;
      return {
        market: m,
        totalTrades: row?.total || 0,
        winRate: row?.win_rate || 0,
        avgReturn: row?.avg_return || 0,
        totalPnl: row?.total_pnl || 0,
      };
    });
  }

  getTradesByMarket(market?: string): Trade[] {
    if (market && market !== '전체') {
      return db.select().from(trades).where(eq(trades.market, market)).orderBy(desc(trades.signalDate)).all();
    }
    return db.select().from(trades).orderBy(desc(trades.signalDate)).all();
  }

  insertTrades(data: InsertTrade[]) {
    for (const d of data) {
      db.insert(trades).values(d).run();
    }
  }

  getNewsByCode(code: string): News[] {
    return db.select().from(news).where(eq(news.code, code)).orderBy(desc(news.date)).limit(10).all();
  }

  getLatestNews(limit: number): News[] {
    return db.select().from(news).orderBy(desc(news.fetchedAt)).limit(limit).all();
  }

  insertNews(data: InsertNews[]) {
    for (const d of data) {
      db.insert(news).values(d).run();
    }
  }

  clearNewsForCode(code: string) {
    db.delete(news).where(eq(news.code, code)).run();
  }

  getMeta(key: string): string | null {
    const row = db.select().from(meta).where(eq(meta.key, key)).get();
    return row?.value ?? null;
  }

  setMeta(key: string, value: string) {
    db.insert(meta).values({ key, value }).onConflictDoUpdate({ target: meta.key, set: { value } }).run();
  }

  getDailySummary() {
    const rows = db.all(sql`
      SELECT date, COUNT(*) as total,
             SUM(CASE WHEN market = 'KOSPI' THEN 1 ELSE 0 END) as kospi,
             SUM(CASE WHEN market = 'KOSDAQ' THEN 1 ELSE 0 END) as kosdaq
      FROM signals GROUP BY date ORDER BY date DESC
    `) as any[];
    return rows.map(r => ({ date: r.date, total: r.total, kospi: r.kospi, kosdaq: r.kosdaq }));
  }
}

export const storage = new DatabaseStorage();
