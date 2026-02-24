import { useEffect, useState, useMemo } from "react";
import { fetchChannelProfit } from "../api";

function money(n) {
  return Number(n ?? 0).toLocaleString();
}

// Dachboardから「期間」と「更新トリガー」をもらう
export default function ChannelProfitPanel({ from, to, reloadKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="mt-2">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 className="h5 mb-3">チャネル別利益</h3>
        <div className="text-muted small">
          {from && to ? `${from}～${to}` : "期間：全期間"}
          {loading ? "（更新中）" : ""}
        </div>
      </div>

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
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
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
