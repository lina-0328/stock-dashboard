import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

export function registerRoutes(server: Server, app: Express) {
  // Seed on startup
  seedDatabase();

  // Latest signals (today's stocks)
  app.get("/api/signals/latest", (_req, res) => {
    const data = storage.getLatestSignals();
    const latestDate = storage.getMeta("latest_date");
    res.json({ date: latestDate, stocks: data });
  });

  // Signals by date
  app.get("/api/signals/:date", (req, res) => {
    const data = storage.getSignalsByDate(req.params.date);
    res.json(data);
  });

  // All signal dates
  app.get("/api/dates", (_req, res) => {
    const dates = storage.getSignalDates();
    res.json(dates);
  });

  // Signals for a specific stock
  app.get("/api/stock/:code", (req, res) => {
    const data = storage.getSignalsByCode(req.params.code);
    res.json(data);
  });

  // Top stocks by frequency
  app.get("/api/top-stocks", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const data = storage.getTopStocks(limit);
    res.json(data);
  });

  // Backtest summary
  app.get("/api/backtest/summary", (_req, res) => {
    const data = storage.getTradesSummary();
    res.json(data);
  });

  // Backtest trades
  app.get("/api/backtest/trades", (req, res) => {
    const market = req.query.market as string;
    const data = storage.getTradesByMarket(market);
    res.json(data);
  });

  // Daily summary
  app.get("/api/daily-summary", (_req, res) => {
    const data = storage.getDailySummary();
    res.json(data);
  });

  // News for a stock
  app.get("/api/news/:code", (req, res) => {
    const data = storage.getNewsByCode(req.params.code);
    res.json(data);
  });

  // Latest news across all stocks
  app.get("/api/news", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 30;
    const data = storage.getLatestNews(limit);
    res.json(data);
  });

  // Meta info
  app.get("/api/meta", (_req, res) => {
    const lastUpdate = storage.getMeta("last_update");
    const dataRange = storage.getMeta("data_range");
    const latestDate = storage.getMeta("latest_date");
    res.json({ lastUpdate, dataRange, latestDate });
  });
}
