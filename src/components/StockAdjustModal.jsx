import { useEffect, useState } from "react";
import { adjustStock } from "../api";

export default function StockAdjustModal({
  open,
  variant,
  onClose,
  onAdjusted,
}) {
  const [newStock, setNewStock] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 開いたとき初期化
  useEffect(() => {
    if (!open || !variant) return;
    setNewStock(String(variant.stock ?? 0));
    setNote("");
    setError("");
  }, [open, variant]);

  if (!open || !variant) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const n = Number(newStock);
    if (Number.isNaN(n) || n < 0) {
      setError("在庫は0以上の数値で入力してください");
      return;
    }

    try {
      setSaving(true);
      await adjustStock(variant.id, {
        newStock: n,
        note: note || "棚卸",
      });

      onAdjusted?.(n); // 親に「新しい在庫数」を通知
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setError(e2.response?.data?.message || "棚卸に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="variant-modal-overlay"
      onClick={() => {
        if (!saving) onClose?.();
      }}
    >
      <div
        className="variant-modal-box p-3 rounded shadow bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="h5 mb-2">棚卸（在庫調整）</h3>

        <div className="mb-2 text-muted">
          <div>SKU: {variant.skuCode}</div>
          <div>作品: {variant.itemName}</div>
          <div>現在の在庫： {variant.stock}</div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">実際の在庫数</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">メモ（任意）</label>
            <input
              type="text"
              className="form-control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="棚卸理由など"
            />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "保存中" : "確定"}
            </button>
            <button
              type="button"
              className="btn btn-outline-sevondary"
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
