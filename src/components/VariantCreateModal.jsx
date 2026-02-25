import { useEffect, useState } from "react";
import { createVariant, fetchItems } from "../api";
import BaseModal from "./BaseModal";

export default function VariantCreateModal({ open, onClose, onCreated }) {
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");

  const [skuCode, setSkuCode] = useState("");
  const [stock, setStock] = useState("0");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("0");
  const [price, setPrice] = useState("0");

  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // open=trueになったタイミングでitemsを取得＆初期化
  useEffect(() => {
    if (!open) return;

    setError("");
    setSaving(false);

    const load = async () => {
      try {
        setLoadingItems(true);
        const res = await fetchItems();
        const list = Array.isArray(res.data) ? res.data : [];
        setItems(list);

        if (list.length > 0) {
          setItemId(String(list[0].id));
        } else {
          setItemId("");
        }
      } catch (e) {
        console.error(e);
        setItems([]);
        setItemId("");
        setError("作品一覧の取得に失敗しました");
      } finally {
        setLoadingItems(false);
      }
    };

    load();
  }, [open]);

  if (!open) return null;

  const busy = saving || loadingItems;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!itemId) return setError("作品を選択してください");
    if (!skuCode.trim()) return setError("SKUは必須です");

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

      onCreated?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "バリエ登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="バリエーション追加"
      size="md"
      busy={busy}
      footer={
        <>
          <button
            type="submit"
            form="variant-create-form"
            className="btn btn-primary"
            disabled={busy}
          >
            {saving ? "登録中" : "登録"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={busy}
          >
            キャンセル
          </button>
        </>
      }
    >
      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loadingItems ? (
        <div className="d-flex align-items-center gap-2">
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />
          <span className="text-muted">作品一覧を読み込み中...</span>
        </div>
      ) : (
        <form id="variant-create-form" onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">作品</label>
            <select
              className="form-select"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={busy}
            >
              {items.length === 0 ? (
                <option value="">（作品がありません）</option>
              ) : (
                items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}(id:{it.id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">SKU</label>
            <input
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder="例：EARRING-RED-S"
              className="form-control"
              disabled={busy}
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
                disabled={busy}
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
                disabled={busy}
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
                disabled={busy}
              />
            </div>
          </div>
        </form>
      )}
    </BaseModal>
  );
}
