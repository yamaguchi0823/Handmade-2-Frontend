import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

import styles from "./ChannelProfitPanel.module.css";

function number(value) {
  return Number(value ?? 0).toLocaleString("ja-JP");
}

function rate(profit, totalAmount) {
  const amount = Number(totalAmount ?? 0);
  if (amount === 0) return "-";
  return `${((Number(profit ?? 0) / amount) * 100).toFixed(1)}%`;
}

const metricSettings = {
  profit: { label: "利益", unit: "円" },
  totalAmount: { label: "売上", unit: "円" },
  salesCount: { label: "件数", unit: "件" },
};

export default function ChannelProfitPanel({ rows, loading, from, to }) {
  const [metric, setMetric] = useState("profit");

  const [isMobile, setIsMobile] = useState(
    () =>
      window.matchMedia(
        "(max-width: 767.98px)",
      ).matches,
  );

  useEffect(() =>{
    const mediaQuery = window.matchMedia(
      "(max-width: 767.98px)",
    );

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener(
      "change",
      handleChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange,
      );
    };
  },[]);

  const total = useMemo(() => {
    const sum = (key) =>
      rows.reduce((result, row) => result + Number(row?.[key] ?? 0), 0);

    return {
      salesCount: sum("salesCount"),
      totalAmount: sum("totalAmount"),
      totalCost: sum("totalCost"),
      feeAmount: sum("feeAmount"),
      fixedAmount: sum("fixedAmount"),
      profit: sum("profit"),
    };
  }, [rows]);

  const chartData = useMemo(
  () =>
    rows
      .map((row) => {
        const profit = Number(row.profit ?? 0);

        const totalAmount = Number(
          row.totalAmount ?? 0,
        );
        const salesCount = Number(
          row.salesCount ?? 0,
        );

        const metricValue = {
          profit,
          totalAmount,
          salesCount,
        }[metric];

        return {
          name: row.channelName ?? "未設定",
          profit,
          totalAmount,
          salesCount,

          // マイナス利益も右方向へ表示するため、
          // グラフ上では絶対値を使用する
          chartValue:
            metric === "profit"
              ? Math.abs(profit)
              : metricValue,
        };
      })
      .sort(
        (a, b) =>
          Number(b.chartValue) -
          Number(a.chartValue),
      ),
  [rows, metric],
);

  const periodText =
    from && to ? `${from} ～ ${to}` : from ? `${from} 以降` : to ? `${to} 以前` : "全期間";

  const formatChannelName = (value) => {
    const name = String(value ?? "");

    if (!isMobile || name.length <= 7) {
      return name;
    }

    return `${name.slice(0, 7)}...`;
  };

  return (
    <section className={styles.panel} aria-labelledby="channel-title">
      <div className={styles.sectionHeading}>
        <h2 id="channel-title">チャネル別</h2>
        <p>{periodText}</p>
      </div>

      {loading && rows.length === 0 && (
        <div className="app-loading-state" role="status">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>集計データを読み込んでいます</span>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="app-empty-state">
          <p className="app-empty-state__title">データがありません</p>
          <p className="app-empty-state__description">
            指定した期間には販売データがありません。
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>販売実績</h3>
              <div className={styles.metricSwitch} aria-label="グラフの表示項目">
                {Object.entries(metricSettings).map(([key, setting]) => (
                  <button
                    key={key}
                    type="button"
                    className={metric === key ? styles.metricActive : ""}
                    aria-pressed={metric === key}
                    onClick={() => setMetric(key)}
                  >
                    {setting.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={styles.chart}
              style={{
                height: `${Math.max(
                  180,
                  chartData.length * 36 + 60,
                )}px`
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
                initialDimension={{ width: 1, height: 300 }}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: 16,
                    left: isMobile ? 0 : 16,
                    bottom: 8
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 3"
                    strokeWidth={0.6}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={metric !== "salesCount"}
                   />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isMobile ? 76 :120}
                    tickFormatter={formatChannelName}
                    tick={{
                      fontSize: isMobile ? 12 : 14,
                    }}
                   />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }

                      const row = payload[0].payload;
                      const originalValue = row[metric];

                      return (
                        <div className={styles.tooltip}>
                          <strong>{label}</strong>

                          <span>
                            {metricSettings[metric].label}:
                            {number(originalValue)}
                            {metricSettings[metric].unit}
                          </span>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="chartValue"
                    barSize={18}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          metric === "profit" &&
                          entry.profit < 0
                            ? "#dc3545"
                            : "#5792f5"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className={styles.chartNote}>
              ※ マイナスの利益は赤色で表示します
            </p>

            {metric === "profit" && (
              <div
                className={styles.chartLegend}
                aria-label="グラフの色分け"
              >
                <span>
                  <i
                    className={styles.positiveSwatch}
                    aria-hidden="true"
                  />
                  プラス
                </span>

                <span>
                  <i
                    className={styles.negativeSwatch}
                    aria-hidden="true"
                  />
                  マイナス
                </span>
              </div>
            )}
          </div>

          <div className={styles.tableHeading}>
            <h3>チャネル別 内訳</h3>
            <p>{periodText}</p>
          </div>

          <div className={styles.desktopTableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>販売チャネル</th>
                  <th>販売件数</th>
                  <th>売上</th>
                  <th>原価</th>
                  <th>手数料</th>
                  <th>固定費</th>
                  <th>利益</th>
                  <th>利益率</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.totalRow}>
                  <th scope="row">合計</th>
                  <td>{number(total.salesCount)}</td>
                  <td>{number(total.totalAmount)}</td>
                  <td>{number(total.totalCost)}</td>
                  <td>{number(total.feeAmount)}</td>
                  <td>{number(total.fixedAmount)}</td>
                  <td className={total.profit < 0 ? styles.negative : ""}>{number(total.profit)}</td>
                  <td className={total.profit < 0 ? styles.negative : ""}>
                    {rate(total.profit, total.totalAmount)}
                  </td>
                </tr>
                {rows.map((row, index) => (
                  <tr key={`${row.channelId ?? row.channelName}-${index}`}>
                    <th scope="row">{row.channelName ?? "未設定"}</th>
                    <td>{number(row.salesCount)}</td>
                    <td>{number(row.totalAmount)}</td>
                    <td>{number(row.totalCost)}</td>
                    <td>{number(row.feeAmount)}</td>
                    <td>{number(row.fixedAmount)}</td>
                    <td className={Number(row.profit) < 0 ? styles.negative : ""}>{number(row.profit)}</td>
                    <td className={Number(row.profit) < 0 ? styles.negative : ""}>
                      {rate(row.profit, row.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileBreakdown}>
            <h3>チャネル別 内訳</h3>
            {rows.map((row, index) => (
              <details key={`${row.channelId ?? row.channelName}-${index}`} className={styles.channelDetails}>
                <summary>{row.channelName ?? "未設定"}</summary>
                <dl>
                  <div><dt>販売件数</dt><dd>{number(row.salesCount)}件</dd></div>
                  <div><dt>売上</dt><dd>{number(row.totalAmount)}円</dd></div>
                  <div><dt>原価</dt><dd>{number(row.totalCost)}円</dd></div>
                  <div><dt>手数料</dt><dd>{number(row.feeAmount)}円</dd></div>
                  <div><dt>固定費</dt><dd>{number(row.fixedAmount)}円</dd></div>
                  <div><dt>利益</dt><dd className={Number(row.profit) < 0 ? styles.negative : ""}>{number(row.profit)}円</dd></div>
                  <div><dt>利益率</dt><dd>{rate(row.profit, row.totalAmount)}</dd></div>
                </dl>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
