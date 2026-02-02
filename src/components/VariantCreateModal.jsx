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
      <div className="variant-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="variant-modal-title">バリエーション追加</h3>

        {error && <div className="variant-modal-error">{error}</div>}

        {loadingItems ? (
          <div>作品一覧を読み込み中・・・</div>
        ) : (
          <form onSubmit={submit}>
            <div className="variant-form-row">
              <label className="variant-form-label">作品</label>
              <select
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

            <div className="variant-form-row">
              <label className="variant-form-label">SKU</label>
              <input
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="例：EARRING-RED-S"
                className="variant-input-sku"
              />
            </div>

            <div className="variant-form-row">
              <label className="variant-form-label">初期在庫</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                className="variant-input-number"
              />
            </div>

            <div className="variant-form-row">
              <label className="variant-form-label">価格</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                className="variant-input-number"
              />
            </div>

            <div className="variant-modal-buttons">
              <button type="submit" disabled={saving}>
                {saving ? "登録中" : "登録"}
              </button>
              <button type="button" onClick={onClose} disabled={saving}>
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
