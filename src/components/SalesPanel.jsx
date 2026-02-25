import { useEffect, useState } from "react";
import { fetchSales, fetchSaleDetail } from "../api";
import SaleDetailModal from "./SaleDetailModal";

export default function SalesPanel({ onChanged }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchSales(50);
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError("販売一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (onChanged) load();
  }, [onChanged]); // 必要なら後で削除OK

  const openDetail = async (saleId) => {
    try {
      setError("");
      const res = await fetchSaleDetail(saleId);
      setDetail(res.data);
      setDetailOpen(true);
    } catch (e) {
      console.error(e);
      setError("販売詳細の取得に失敗しました");
    }
  };

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="h4 mb-0">販売一覧</h2>
        <button
          className="btn btn-outline-secondary"
          onClick={load}
          disabled={loading}
        >
          {loading ? "更新中" : "更新"}
        </button>
      </div>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th className="u-w-80">ID</th>
              <th>販売日時</th>
              <th className="u-w-80">点数</th>
              <th className="u-w-100">合計</th>
              <th>チャネル</th>
              <th>利益</th>
              <th>メモ</th>
              <th className="u-w-80">操作</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.soldAt}</td>
                <td className="text-end">{s.totalQty}</td>
                <td className="text-end">
                  {s.totalAmount != null
                    ? Number(s.totalAmount).toLocaleString()
                    : "-"}
                </td>
                <td>{s.channelName ?? "-"}</td>
                <td
                  className={`text-end ${Number(s.profit ?? 0) < 0 ? "text-danger" : ""}`}
                >
                  {s.profit != null ? Number(s.profit).toLocaleString() : "-"}
                </td>
                <td className="u-maxw-240 text-truncate" title={s.note ?? ""}>
                  {s.note ?? ""}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => openDetail(s.id)}
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  販売データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SaleDetailModal
        open={detailOpen}
        sale={detail}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
      />
    </div>
  );
}
