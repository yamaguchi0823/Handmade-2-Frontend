import { useEffect, useState, useMemo } from "react";
import { fetchChannelProfit } from "../api";

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

function money(n) {
  return Number(n ?? 0).toLocaleString();
}

// Dachboardから「期間」と「更新トリガー」をもらう
export default function ChannelProfitPanel({ from, to, reloadKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState("profit"); // profit or totalAmont

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchChannelProfit({
          from: from || undefined,
          to: to || undefined,
        });
        setRows(res.data ?? []);
      } catch (e) {
        console.error(e);
        alert("集計取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    load();
    // reloadKeyが変わった時だけ再取得する
  }, [reloadKey, from, to]);

  // 合計（rowsが変わったら計算しなおす）
  const total = useMemo(() => {
    const sum = (key) =>
      rows.reduce((acc, r) => acc + Number(r?.[key] ?? 0), 0);
    return {
      salesCount: sum("salesCount"),
      totalAmount: sum("totalAmount"),
      totalCost: sum("totalCost"),
      feeAmount: sum("feeAmount"),
      fixedAmount: sum("fixedAmount"),
      profit: sum("profit"),
    };
  }, [rows]);

  // グラフ用データ（利益が大きい順）
  const chartData = useMemo(() => {
    const key = metric; // "profit" or "totalAmount"

    return rows
      .map((r) => {
        const profit = Number(r.profit ?? 0);
        const totalAmount = Number(r.totalAmount ?? 0);
        const profitRate =
          totalAmount === 0 ? null : (profit / totalAmount) * 100;

        return {
          name: r.channelName ?? "未設定",
          profit,
          totalAmount,
          profitRate,
        };
      })
      .sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0));
  }, [rows, metric]);

  return (
    <div className="mt-2">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="h5 mb-3">チャネル別利益</h3>
        <div className="text-muted small">
          {from && to ? `${from}～${to}` : "期間：全期間"}
          {loading ? "（更新中）" : ""}
        </div>
      </div>

      {/* 横棒グラフ（売上/利益 切替） */}
      {chartData.length > 0 && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
              <div className="fw-semibold mb-2">
                {metric === "profit"
                  ? "利益（チャネル別）"
                  : "売上（チャネル別）"}
              </div>
              {/* 切替スイッチ */}
              <div
                className="btn-group"
                role="group"
                aria-label="metric switch"
              >
                <button
                  type="button"
                  className={`btn btn-sm ${
                    metric === "profit" ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setMetric("profit")}
                >
                  利益
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    metric === "totalAmount"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setMetric("totalAmount")}
                >
                  売上
                </button>
              </div>
            </div>

            <div style={{ width: "100%", height: 230 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  layout="vertical" // 横棒
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  {/* 数値軸 */}
                  <XAxis type="number" />
                  {/* チャネル名 */}
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0)
                        return null;

                      const d = payload[0].payload; // chartDataの１行分
                      const value = d?.[metric];

                      const rateText =
                        d.profitRate == null
                          ? "-"
                          : `${d.profitRate.toFixed(1)}%`;

                      return (
                        <div className="bg-white border rounded px-2 py-1 small">
                          <div className="fw-semibold mb-1">{label}</div>

                          <div>
                            {metric === "profit" ? "利益" : "売上"}:
                            {money(value)}
                          </div>
                          {/* <div>売上：{money(d.totalAmount)}</div>
                          <div>利益：{money(d.profit)}</div> */}
                          <div>
                            利益率：
                            <span className={d.profit < 0 ? "text-danger" : ""}>
                              {rateText}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* 切替本体 */}
                  <Bar dataKey={metric}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.profit < 0 ? "#dc3545" : "#0d6efd"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-muted small">
              {metric === "profit"
                ? "※ 棒がマイナスの場合は左方向に伸びます"
                : "※ 売上の大きいチャネルが一目でわかります"}
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>チャネル</th>
              <th className="text-end">販売件数</th>
              <th className="text-end">売上</th>
              <th className="text-end">原価</th>
              <th className="text-end">手数料</th>
              <th className="text-end">固定費</th>
              <th className="text-end">利益</th>
              <th className="text-end">利益率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.channelId ?? "none"}>
                <td>{r.channelName}</td>
                <td className="text-end">{r.salesCount ?? 0}</td>
                <td className="text-end">{money(r.totalAmount)}</td>
                <td className="text-end">{money(r.totalCost)}</td>
                <td className="text-end">{money(r.feeAmount)}</td>
                <td className="text-end">{money(r.fixedAmount)}</td>
                <td
                  className={`text-end ${
                    Number(r.profit ?? 0) < 0 ? "text-danger" : ""
                  }`}
                >
                  {money(r.profit)}
                </td>
                <td
                  className={`text-end ${
                    Number(r.profit ?? 0) < 0 ? "text-danger" : ""
                  }`}
                >
                  {(() => {
                    const amt = Number(r.totalAmount ?? 0);
                    const profit = Number(r.profit ?? 0);
                    if (amt === 0) return "-";
                    return `${((profit / amt) * 100).toFixed(1)}%`;
                  })()}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  データがありません
                </td>
              </tr>
            )}
          </tbody>

          {/* 合計行 */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="table-light">
                <th>合計</th>
                <th className="text-end">{money(total.salesCount)}</th>
                <th className="text-end">{money(total.totalAmount)}</th>
                <th className="text-end">{money(total.totalCost)}</th>
                <th className="text-end">{money(total.feeAmount)}</th>
                <th className="text-end">{money(total.fixedAmount)}</th>
                <th
                  className={`text-end ${
                    Number(total.profit) < 0 ? "text-danger" : ""
                  }`}
                >
                  {money(total.profit)}
                </th>
                <th
                  className={`text-end ${Number(total.profit ?? 0) < 0 ? "text-danger" : ""}`}
                >
                  {(() => {
                    const amt = Number(total.totalAmount ?? 0);
                    const profit = Number(total.profit ?? 0);
                    if (amt === 0) return "-";
                    return `${((profit / amt) * 100).toFixed(1)}%`;
                  })()}
                </th>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* さらに見やすい：下に1行で要約 */}
      {rows.length > 0 && (
        <div className="text-muted small">
          合計：売上{money(total.totalAmount)} ／ 利益{" "}
          <span className={Number(total.profit) < 0 ? "text-danger" : ""}>
            {money(total.profit)}
          </span>
        </div>
      )}
    </div>
  );
}
