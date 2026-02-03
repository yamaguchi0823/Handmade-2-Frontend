import { useEffect, useState } from "react";
import { createVariant, fetchItems } from "../api";
import "./VariantCreateModal.css";

export default function VariantCreateModal({ open, onClose, onCreated }) {
  // 作品一覧と選択中の作品
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  // 入力フォームの値（input要素と結びつく）
  const [skuCode, setSkuCode] = useState("");
  const [stock, setStock] = useState("0");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("0");
  const [price, setPrice] = useState("0");

  // 画面制御用
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // open=trueになったタイミングでitemsを取得
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        setLoadingItems(true);
        setError("");
        const res = await fetchItems();
        setItems(res.data);

        // 作品があるなら最初のものをデフォルト選択
        if (res.data?.length > 0) {
          setItemId(String(res.data[0].id));
        }
      } catch (e) {
        console.error(e);
        setError("作品一覧の取得に失敗しました");
      } finally {
        setLoadingItems(false);
      }
    };

    load();
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!itemId) {
      setError("作品を選択してください");
      return;
    }
    if (!skuCode.trim()) {
      setError("SKUは必須です");
      return;
    }

    try {
      setSaving(true);

      await createVariant({
        itemId: Number(itemId),
        skuCode: skuCode.trim(),
        stock: Number(stock || 0),
        stockAlertThreshold: Number(stockAlertThreshold || 0),
        price: Number(price || 0),
        status: "ACTIVE",
      });

      // 成功したら閉じる＆親に通知
      onCreated?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "バリエ登録に失敗した！";
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
          <h3 className="h5 mb-3">バリエーション追加</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        {loadingItems ? (
          <div className="text-muted">作品一覧を読み込み中・・・</div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">作品</label>
              <select
                className="form-select"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}(id:{it.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">SKU</label>
              <input
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="例：EARRING-RED-S"
                className="form-control"
              />
            </div>

            <div className="mb-3 row g-2">
              <div className="col">
                <label className="form-label">初期在庫</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  className="form-control"
                />
              </div>

              <div className="col">
                <label className="form-label">在庫しきい値</label>
                <input
                  type="number"
                  value={stockAlertThreshold}
                  onChange={(e) => setStockAlertThreshold(e.target.value)}
                  min="0"
                  className="form-control"
                  placeholder="例：3"
                />
              </div>

              <div className="col">
                <label className="form-label">価格</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  className="form-control"
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "登録中" : "登録"}
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
        )}
      </div>
    </div>
  );
}
