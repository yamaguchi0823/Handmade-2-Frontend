import { useEffect, useState } from "react";
import { fetchStockHistory } from "../api";
import BaseModal from "./BaseModal";

export default function StockHistoryModal({ open, onClose, variant }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !variant) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetchStockHistory(variant.id, 50);
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setError("履歴の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, variant]);

  if (!open || !variant) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="在庫履歴"
      size="lg"
      busy={loading}
      footer={
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={loading}
        >
          閉じる
        </button>
      }
    >
      <div className="mb-2 text-muted">
        <div>
          SKU: <span className="fw-semibold">{variant.skuCode}</span>
        </div>
        <div>作品:{variant.itemName}</div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          <span className="text-muted">読み込み中...</span>
        </div>
      ) : (
        <table className="table table-sm table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th className="stockhist-th-dt">日時</th>
              <th className="stockhist-th-type">種別</th>
              <th className="text-end stockhist-th-num">増減</th>
              <th className="text-end stockhist-th-num">前</th>
              <th className="text-end stockhist-th-num">後</th>
              <th>メモ</th>
              <th>参照</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="">{String(r.createdAt ?? "-")}</td>
                <td className="">{r.movementType ?? "-"}</td>
                <td className="text-end">{r.delta ?? 0}</td>
                <td className="text-end">{r.qtyBefore ?? 0}</td>
                <td className="text-end">{r.qtyAfter ?? 0}</td>
                <td>{r.note ?? ""}</td>
                <td>{r.refType ? `${r.refType}` : ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-3">
                  履歴がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </BaseModal>
  );
}
