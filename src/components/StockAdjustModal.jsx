import { useEffect, useState } from "react";
import { adjustStock } from "../api";
import BaseModal from "./BaseModal";

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
    setSaving(false);
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
        note: (note || "").trim() || "棚卸",
      });

      onAdjusted?.(n);
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "棚卸に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="棚卸（在庫調整）"
      size="sm"
      busy={saving}
      footer={
        <>
          <button
            type="submit"
            form="stock-adjust-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "保存中" : "確定"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={saving}
          >
            キャンセル
          </button>
        </>
      }
    >
      <div className="mb-2 text-muted">
        <div>
          SKU: <span className="fw-semibold">{variant.skuCode}</span>
        </div>
        <div>作品：{variant.itemName}</div>
        <div>現在の在庫：{variant.stock}</div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form id="stock-adjust-form" onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">実際の在庫数</label>
          <input
            type="number"
            min="0"
            className="form-control"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            disabled={saving}
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
            disabled={saving}
          />
        </div>
      </form>
    </BaseModal>
  );
}
