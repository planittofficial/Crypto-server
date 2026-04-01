export type SignalRecord = {
  _id?: string;
  asset: string;
  signal_type: "BUY" | "SELL";
  entry_range: number[];
  stop_loss: number;
  take_profit: { tp1: number; tp2: number; tp3: number };
  timeframe: string;
  confidence: number;
  strategy: string;
  reason: string;
  validity: string;
  created_at: string;
  status: "active" | "hit_tp" | "hit_sl" | "expired";
  risk_reward_ratio: string;
  expires_at?: string | null;
  dedup_key?: string;
};

export type PerformanceSummary = {
  total: number;
  active: number;
};

export type GenerateRequest = {
  symbol: string;
  timeframe: string;
  strategy?: string;
};

export type NewsItem = {
  title: string;
  source?: string;
  link?: string;
  published_at?: string;
  sentiment?: string;
  confidence?: number;
};

