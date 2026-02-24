import { useEffect, useState } from "react";
import { fetchStockHistory } from "../api";

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

  useEffect(() => {
    if (!open) return;
    // モーダル表示中は背景スクロール禁止
    document.body.classList.add("modal-open");
    // 閉じたら戻す（重要）
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  if (!open || !variant) return null;

  return (
    <div
      className="variant-modal-overlay"
      onClick={() => {
        if (!loading) onClose?.();
      }}
    >
      <div
        className="variant-modal-box p-3 rounded shadow bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3 className="h5 mb-0">在庫履歴</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

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
          <div className="variant-modal-body table-responsive">
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
          </div>
        )}

        <div className="d-flex justify-content-end mt-2">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
