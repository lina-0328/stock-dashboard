// Seed DB from data_export.json
import fs from "fs";
import path from "path";
import { storage, db } from "./storage";
import { signals, trades, news } from "@shared/schema";
import { sql } from "drizzle-orm";

export function seedDatabase() {
  const dataPath = path.join(process.cwd(), "data_export.json");
  if (!fs.existsSync(dataPath)) {
    console.log("No data_export.json found, skipping seed");
    return;
  }

  // Check if already seeded
  const count = db.get(sql`SELECT COUNT(*) as c FROM signals`) as any;
  if (count?.c > 0) {
    console.log(`DB already has ${count.c} signals, skipping seed`);
    return;
  }

  console.log("Seeding database from data_export.json...");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Insert signals
  const signalData = data.history.map((h: any) => ({
    date: h.date,
    market: h.market,
    code: h.code,
    name: h.name,
    frgnAmount: h.frgn_amount,
    instAmount: h.inst_amount,
    totalAmount: h.total_amount,
    priceAtDate: h.price_at_date,
    currentPrice: h.current_price,
    returnPct: h.return_pct,
    freqDays: h.freq_days,
  }));
  storage.insertSignals(signalData);
  console.log(`  Inserted ${signalData.length} signals`);

  // Insert trades
  const tradeData = data.backtest.map((t: any) => ({
    signalDate: t.signal_date,
    buyDate: t.buy_date,
    sellDate: t.sell_date,
    isOpen: t.is_open ? 1 : 0,
    code: t.code,
    name: t.name,
    market: t.market,
    buyPrice: t.buy_price,
    sellPrice: t.sell_price,
    retPct: t.ret_pct,
    profit1share: t.profit_1share,
    invest1share: t.invest_1share,
  }));
  storage.insertTrades(tradeData);
  console.log(`  Inserted ${tradeData.length} trades`);

  // Set meta
  storage.setMeta("last_update", new Date().toISOString());
  storage.setMeta("latest_date", data.latest_date);
  storage.setMeta("data_range", `${data.dates[0]} ~ ${data.dates[data.dates.length - 1]}`);

  console.log("Seed complete!");
}
