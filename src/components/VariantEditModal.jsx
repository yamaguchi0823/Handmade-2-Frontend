import { useEffect, useState } from "react";
import { updateVariant } from "../api";

export default function VariantEditModal({
  open,
  onClose,
  variant,
  onUpdated,
}) {
  const [status, setStatus] = useState("ACTIVE");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("0");
  const [price, setPrice] = useState("0");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 開いたときに初期値リセット
  useEffect(() => {
    if (!open || !variant) return;
    setStatus(variant.status ?? "ACTIVE");
    setStockAlertThreshold(String(variant.stockAlertThreshold ?? 0));
    setPrice(String(variant.price ?? 0));
    setError("");
  }, [open, variant]);

  if (!open || !variant) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);

      await updateVariant(variant.id, {
        status,
        stockAlertThreshold: Number(stockAlertThreshold || 0),
        price: Number(price || 0),
      });

      onUpdated?.();
      onClose?.();
    } catch (e2) {
      console.error(e2);
      const msg = e2.response?.data?.message || "更新に失敗しました";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="variant-modal-overlay" onClick={onClose}>
      <div
        className="variant-modal-box p-3 rounded shadow bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3 className="h5 mb-0">バリエーション編集</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mb-2 text-muted">
          <div>
            SKU:<span className="fw-semibold">{variant.skuCode}</span>
          </div>
          <div>作品：{variant.itemName}</div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">ステータス</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE(販売中)</option>
              <option value="INACTIVE">INACTIVE(停止)</option>
            </select>
          </div>

          <div className="row g-2 mb-3">
            <div className="col">
              <label className="form-label">在庫しきい値</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={stockAlertThreshold}
                onChange={(e) => setStockAlertThreshold(e.target.value)}
              />
              <div className="form-text">この数以下で「在庫少」表示</div>
            </div>

            <div className="col">
              <label className="form-label">価格</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
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
