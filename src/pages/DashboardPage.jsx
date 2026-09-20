import { useEffect, useMemo, useState } from "react";

import {
  fetchChannelProfit,
  fetchLowStockVariants,
} from "../api";

import PageHeader from "../components/PageHeader";
import ChannelProfitPanel from "../components/ChannelProfitPanel";
import styles from "./DashboardPage.module.css";

function ymd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRangeToday() {
  const now = new Date();
  return {
    from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function money(value) {
  return Number(value ?? 0).toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
  });
}

function countDays(from, to) {
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.floor((end - start) / 86400000) + 1;
}

export default function DashboardPage() {
  const initialRange = useMemo(() => monthRangeToday(), []);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [channelRows, setChannelRows] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const sum = (key) =>
      channelRows.reduce(
        (total, row) => total + Number(row?.[key] ?? 0),
        0,
      );

    return {
      salesCount: sum("salesCount"),
      totalAmount: sum("totalAmount"),
      profit: sum("profit"),
      lowStockCount,
    };
  }, [channelRows, lowStockCount]);

  const loadDashboard = async (nextFrom = from, nextTo = to) => {
    if (nextFrom && nextTo && nextFrom > nextTo) {
      setError("開始日は終了日以前の日付を選択してください");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [profitResponse, lowStockResponse] = await Promise.all([
        fetchChannelProfit({
          from: nextFrom || undefined,
          to: nextTo || undefined,
        }),
        fetchLowStockVariants(),
      ]);

      setChannelRows(
        Array.isArray(profitResponse.data) ? profitResponse.data : [],
      );
      setLowStockCount(
        Array.isArray(lowStockResponse.data)
          ? lowStockResponse.data.length
          : 0,
      );
      setAppliedRange({ from: nextFrom, to: nextTo });
    } catch (e) {
      console.error(e);
      setError("ダッシュボード集計の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(initialRange.from, initialRange.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearConditions = () => {
    setFrom("");
    setTo("");
    loadDashboard("", "");
  };

  const dayCount = countDays(appliedRange.from, appliedRange.to);
  const periodText =
    appliedRange.from && appliedRange.to
      ? `${appliedRange.from} ～ ${appliedRange.to}`
      : appliedRange.from
        ? `${appliedRange.from} 以降`
        : appliedRange.to
          ? `${appliedRange.to} 以前`
          : "全期間";

  return (
    <div className={styles.dashboard}>
      <PageHeader title="ダッシュボード" />

      <section className={styles.periodPanel} aria-labelledby="period-title">
        <h2 id="period-title" className="visually-hidden">
          集計期間
        </h2>

        <form
          className={styles.periodForm}
          aria-busy={loading}
          onSubmit={(e) => {
            e.preventDefault();
            loadDashboard();
          }}
        >
          <div className={styles.periodField}>
            <label htmlFor="dashboard-from" className="form-label">
              開始日
            </label>
            <input
              id="dashboard-from"
              type="date"
              className="form-control"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.periodField}>
            <label htmlFor="dashboard-to" className="form-label">
              終了日
            </label>
            <input
              id="dashboard-to"
              type="date"
              className="form-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.periodActions}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "集計中..." : "集計"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={clearConditions}
              disabled={loading || (!from && !to)}
            >
              条件をクリア
            </button>
          </div>
        </form>

        <p className={styles.periodResult}>
          {dayCount != null
            ? `${dayCount}日間の集計を表示しています`
            : `${periodText}の集計を表示しています`}
        </p>
      </section>

      {error && (
        <div className="app-feedback app-feedback--error" role="alert">
          {error}
        </div>
      )}

      <section aria-labelledby="summary-title">
        <div className={styles.sectionHeading}>
          <h2 id="summary-title">サマリー</h2>
          <p>{periodText}</p>
        </div>

        <div className={styles.summaryGrid} aria-busy={loading}>
          <article className={`card ${styles.summaryCard}`}>
            <h3 className={styles.summaryLabel}>売上</h3>
            <p className={styles.summaryValue}>{money(summary.totalAmount)}</p>
          </article>

          <article className={`card ${styles.summaryCard}`}>
            <h3 className={styles.summaryLabel}>利益</h3>
            <p
              className={`${styles.summaryValue} ${
                summary.profit < 0 ? styles.negativeValue : ""
              }`}
            >
              {money(summary.profit)}
            </p>
          </article>

          <article className={`card ${styles.summaryCard}`}>
            <h3 className={styles.summaryLabel}>販売件数</h3>
            <p className={styles.summaryValue}>
              {summary.salesCount.toLocaleString("ja-JP")}件
            </p>
          </article>

          <article className={`card ${styles.summaryCard}`}>
            <h3 className={styles.summaryLabel}>在庫少（現在）</h3>
            <p className={styles.summaryValue}>
              {summary.lowStockCount.toLocaleString("ja-JP")}件
            </p>
          </article>
        </div>
      </section>

      <ChannelProfitPanel
        rows={channelRows}
        loading={loading}
        from={appliedRange.from}
        to={appliedRange.to}
      />

      <span className="visually-hidden" role="status" aria-live="polite">
        {loading ? "ダッシュボードを更新しています" : ""}
      </span>
    </div>
  );
}
