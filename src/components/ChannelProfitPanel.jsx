import { useEffect, useState } from "react";
import { fetchChannelProfit } from "../api";

// Dachboardから「期間」と「更新トリガー」をもらう
export default function ChannelProfitPanel({ from, to, reloadkey }) {
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
  }, [reloadkey, from, to]);

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
                <td className="text-end">{r.salesCount}</td>
                <td className="text-end">
                  {Number(r.totalAmount ?? 0).toLocaleString()}
                </td>
                <td className="text-end">
                  {Number(r.totalCost ?? 0).toLocaleString()}
                </td>
                <td className="text-end">
                  {Number(r.feeAmount ?? 0).toLocaleString()}
                </td>
                <td className="text-end">
                  {Number(r.fixedAmount ?? 0).toLocaleString()}
                </td>
                <td
                  className={`text-end ${
                    Number(r.profit ?? 0) < 0 ? "text-danger" : ""
                  }`}
                >
                  {Number(r.profit ?? 0).toLocaleString()}
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
        </table>
      </div>
    </div>
  );
}
