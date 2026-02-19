import { useState } from "react";
import { fetchChannelProfit } from "../api";

export default function ChannelProfitPanel() {
  const [from, setfrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="mt-4">
      <h3 className="h5 mb-3">チャネル別利益</h3>

      <div className="row g-2 mb-3">
        <div className="col">
          <label className="form-label">From</label>
          <input
            type="date"
            className="form-control"
            value={from}
            onChange={(e) => setfrom(e.target.value)}
          />
        </div>

        <div className="col">
          <label className="form-label">To</label>
          <input
            type="date"
            className="form-control"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="col d-flex align-items-end">
          <button
            className="btn btn-primary w-100"
            onClick={load}
            disabled={loading}
          >
            {loading ? "集計中" : "集計"}
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-iddle">
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
