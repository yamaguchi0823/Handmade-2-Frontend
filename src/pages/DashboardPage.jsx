import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  fetchChannelProfit,
  fetchLowStockVariants,
} from "../api";

import PageHeader from "../components/PageHeader";
import styles from "./DashboardPage.module.css";

function ymd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function monthRangeToday() {
  const now = new Date();
  const from = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );
  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  );

  return {
    from: ymd(from),
    to: ymd(to),
  };
}

function money(value) {
  return Number(value ?? 0).toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
  });
}

export default function DashboardPage() {
  const initialRange = useMemo(
    () => monthRangeToday(),
    [],
  );

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    salesCount: 0,
    totalAmount: 0,
    profit: 0,
    lowStockCount: 0,
  });

  const loadSummary = async () => {
    if (from && to && from > to) {
      setError(
        "開始日は終了日以前の日付を選択してください",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [profitResponse, lowStockResponse] =
        await Promise.all([
          fetchChannelProfit({
            from: from || undefined,
            to: to || undefined,
          }),
          fetchLowStockVariants(),
        ]);

      const rows = Array.isArray(profitResponse.data)
        ? profitResponse.data
        : [];

      const lowStockRows = Array.isArray(
        lowStockResponse.data,
      )
        ? lowStockResponse.data
        : [];

      const salesCount = rows.reduce(
        (sum, row) =>
          sum + Number(row.salesCount ?? 0),
        0,
      );

      const totalAmount = rows.reduce(
        (sum, row) =>
          sum + Number(row.totalAmount ?? 0),
        0,
      );

      const profit = rows.reduce(
        (sum, row) =>
          sum + Number(row.profit ?? 0),
        0,
      );

      setSummary({
        salesCount,
        totalAmount,
        profit,
        lowStockCount: lowStockRows.length,
      });
    } catch (e) {
      console.error(e);
      setError(
        "ダッシュボード集計の取得に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();

    // 初回表示時のみ取得
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profitDetailUrl =
    `/profit?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}`;

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        actions={
          <form
            className={styles.periodForm}
            aria-label="集計期間"
            aria-busy={loading}
            onSubmit={(e) => {
              e.preventDefault();
              loadSummary();
            }}
          >
            <div className={styles.periodField}>
              <label
                htmlFor="dashboard-from"
                className="form-label mb-1"
              >
                開始日
              </label>

              <input
                id="dashboard-from"
                type="date"
                className="form-control"
                value={from}
                onChange={(e) =>
                  setFrom(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className={styles.periodField}>
              <label
                htmlFor="dashboard-to"
                className="form-label mb-1"
              >
                終了日
              </label>

              <input
                id="dashboard-to"
                type="date"
                className="form-control"
                value={to}
                onChange={(e) =>
                  setTo(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className={styles.submitArea}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "更新中..." : "更新"}
              </button>
            </div>
          </form>
        }
      />

      {error && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div
        className={styles.summaryGrid}
        aria-busy={loading}
      >
        <section
          className={`card ${styles.summaryCard}`}
          aria-labelledby="dashboard-sales-label"
        >
          <h2
            id="dashboard-sales-label"
            className={styles.summaryLabel}
          >
            期間売上
          </h2>

          <p className={styles.summaryValue}>
            {money(summary.totalAmount)}
          </p>
        </section>

        <Link
          to={profitDetailUrl}
          className={`card ${styles.summaryCard} ${styles.summaryLink}`}
          aria-label={`期間利益 ${money(
            summary.profit,
          )}。利益詳細を表示`}
        >
          <h2 className={styles.summaryLabel}>
            期間利益
          </h2>

          <p
            className={`${styles.summaryValue} ${
              Number(summary.profit) < 0
                ? styles.negativeValue
                : ""
            }`}
          >
            {money(summary.profit)}
          </p>

          <p className={styles.linkHint}>
            利益詳細を見る →
          </p>
        </Link>

        <section
          className={`card ${styles.summaryCard}`}
          aria-labelledby="dashboard-count-label"
        >
          <h2
            id="dashboard-count-label"
            className={styles.summaryLabel}
          >
            期間販売件数
          </h2>

          <p className={styles.summaryValue}>
            {Number(
              summary.salesCount,
            ).toLocaleString("ja-JP")}{" "}
            件
          </p>
        </section>

        <section
          className={`card ${styles.summaryCard}`}
          aria-labelledby="dashboard-stock-label"
        >
          <h2
            id="dashboard-stock-label"
            className={styles.summaryLabel}
          >
            在庫少（現在）
          </h2>

          <p className={styles.summaryValue}>
            {Number(
              summary.lowStockCount,
            ).toLocaleString("ja-JP")}{" "}
            件
          </p>
        </section>
      </div>

      <span
        className="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading
          ? "ダッシュボードを更新しています"
          : ""}
      </span>
    </div>
  );
}