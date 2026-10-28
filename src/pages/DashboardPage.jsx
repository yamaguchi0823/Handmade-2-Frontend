import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function SummaryIcon({ type }) {
  return (
    <svg
      className={styles.summaryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {type === "sales" && (
        <>
          <path d="m6 3 6 8 6-8" />
          <path d="M12 11v10M7 12h10M7 16h10" />
        </>
      )}

      {type === "profit" && (
        <>
          <path d="M5 9a7 7 0 0 1 12-3l3-1v5l2 1v5l-3 1-1 4h-3l-1-3H9l-1 3H5l-1-5a7 7 0 0 1-1-4V9Z" />
          <path d="M9 7h4M2 10H1" />
          <circle cx="17" cy="10" r="0.7" fill="currentColor" />
        </>
      )}

      {type === "count" && (
        <>
          <path d="M2 3h3l3 12h11l3-9H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </>
      )}

      {type === "stock" && (
        <>
          <rect x="3" y="4" width="18" height="17" rx="1" />
          <path d="M9 4v6l3-2 3 2V4M7 16h4" />
        </>
      )}
    </svg>
  );
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
    <div>
      <PageHeader
        title="ダッシュボード"
        description="売上・利益・販売件数・在庫状況を確認します。"
        // actions={}
      />

      <div className={styles.dashboard}>
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
              <h3 className={styles.summaryLabel}>
                <SummaryIcon type="sales" />
                <span>売上</span>
              </h3>
              <p className={styles.summaryValue}>{money(summary.totalAmount)}</p>
            </article>

            <article className={`card ${styles.summaryCard}`}>
              <h3 className={styles.summaryLabel}>
                <SummaryIcon type="profit" />
                <span>利益</span>
              </h3>
              <p
                className={`${styles.summaryValue} ${
                  summary.profit < 0 ? styles.negativeValue : ""
                }`}
              >
                {money(summary.profit)}
              </p>
            </article>

            <article className={`card ${styles.summaryCard}`}>
              <h3 className={styles.summaryLabel}>
                <SummaryIcon type="count" />
                <span>販売件数</span>
              </h3>
              <p className={styles.summaryValue}>
                {summary.salesCount.toLocaleString("ja-JP")}件
              </p>
            </article>

            <Link
              to="/inventory?stockMode=LOW_STOCK"
              className={`card ${styles.summaryCard} ${styles.lowStockCard}`}
            >
            <h3 className={styles.summaryLabel}>
              <SummaryIcon type="stock" />
              <span>在庫少（現在）</span>
            </h3>
            <p
              className={`${styles.summaryValue} ${styles.lowStockValue}`}
            >
              {summary.lowStockCount.toLocaleString("ja-JP")}件
            </p>

            <span className="visually-hidden">
              在庫少で絞り込んだ在庫一覧を開く
            </span>
            </Link>
          </div>
        </section>
      </div>

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
