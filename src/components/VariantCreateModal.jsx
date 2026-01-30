import { useEffect, useState } from "react";
import { createVariant, fetchItems } from "../api";

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

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    background: "#fff",
    padding: 16,
    width: 520,
    borderRadius: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>バリエーション追加</h3>

        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

        {loadingItems ? (
          <div>作品一覧を読み込み中・・・</div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "inline-block", width: 90 }}>作品</label>
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

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "inline-block", width: 90 }}>SKU</label>
              <input
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="例：EARRING-RED-S"
                style={{ width: 300 }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "inline-block", width: 90 }}>
                初期在庫
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                style={{ width: 120 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "inline-block", width: 90 }}>価格</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                style={{ width: 120 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
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
