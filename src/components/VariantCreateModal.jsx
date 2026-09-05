import { useEffect, useState } from "react";
import {
  createVariant,
  fetchItems,
  uploadVariantImage,
} from "../api";
import BaseModal from "./BaseModal";

export default function VariantCreateModal({
  open,
  onClose,
  onCreated,
  initialItemId = null,
}) {
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [stock, setStock] = useState("0");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("0");
  const [price, setPrice] = useState("0");
  const [imageFile, setImageFile] = useState(null);

  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");

  // モーダルを開くたびに入力値を初期化し、作品一覧を取得
  useEffect(() => {
    if (!open) return;

    setVariantName("");
    setSkuCode("");
    setStock("0");
    setStockAlertThreshold("0");
    setPrice("0");
    setImageFile(null);
    setError("");
    setSaving(false);
    setCreated(false);

    const load = async () => {
      try {
        setLoadingItems(true);

        const res = await fetchItems();
        const list = Array.isArray(res.data) ? res.data : [];

        setItems(list);

        if (list.length > 0) {
          const initialItemExisits = list.some(
            (item) => Number(item.id) === Number(initialItemId),
          );

          const selectedItemId = initialItemExisits
            ? initialItemExisits
            : list[0].id;

          setItemId(String(selectedItemId));
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
  }, [open, initialItemId]);

  if (!open) return null;

  const busy = saving || loadingItems;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!itemId) {
      setError("作品を選択してください");
      return;
    }

    if (!variantName.trim) {
      setError("バリエーション名は必須です");
      return;
    }

    try {
      setSaving(true);

      const res = await createVariant({
        itemId: Number(itemId),
        variantName: variantName.trim(),
        skuCode: skuCode.trim() || null,
        stock: Number(stock || 0),
        stockAlertThreshold: Number(stockAlertThreshold || 0),
        price: Number(price || 0),
        status: "ACTIVE",
      });

      const variantId = Number(res.data?.variantId);

      if (!Number.isInteger(variantId) || variantId <= 0) {
        throw new Error("作成されたバリエーションIDを取得できませんでした");
      }

      if (imageFile) {
        try {
          await uploadVariantImage(variantId, imageFile);
        } catch (imageError) {
          console.error(imageError);

          setCreated(true);
          setError(
            "バリエーションは登録されましたが、画像のアップロードに失敗しました。編集画面から画像を登録してください。",
          );

          await onCreated?.();
          return;
        }
      }

      await onCreated?.();
      onClose?.();
    } catch (e) {
      console.error(e);

      const message =
        e?.response?.data?.message ||
        e?.message ||
        "バリエーションの登録に失敗しました";

      setError(message);
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
            disabled={busy || created}
          >
            {saving ? "登録中" : created ? "登録済み" : "登録"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={busy}
          >
            {created ? "閉じる" : "キャンセル"}
          </button>
        </>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

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
              disabled={busy || created}
            >
              {items.length === 0 ? (
                <option value="">（作品がありません）</option>
              ) : (
                items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（ID: {item.id}）
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">バリエーション名</label>
            <input
              type="text"
              value={variantName}
              onChange={(e)=>setVariantName(e.target.value)}
              placeholder="例：モルフォ蝶・サイズ-S"
              className="form-control"
              disabled={busy || created}
             />
             <div className="form-text">
              色・形・タイプなど、バリエーションを識別できる名前
             </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              SKU <span className="text-muted">（任意）</span>
            </label>
            <input
              type="text"
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              placeholder="例：EARRING-RED-S"
              className="form-control"
              disabled={busy || created}
            />
            <div className="form-text">
              未入力の場合はSKUなしで登録されます
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              画像 <span className="text-muted">（任意）</span>
            </label>
            <input
              type="file"
              className="form-control"
              accept=".png,.jpg,.jpeg,.webp,.gif"
              onChange={(e) =>
                setImageFile(e.target.files?.[0] ?? null)
              }
              disabled={busy || created}
            />
            <div className="form-text">
              PNG・JPG・JPEG・WebP・GIFに対応しています
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col">
              <label className="form-label">初期在庫</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                className="form-control"
                disabled={busy || created}
              />
            </div>

            <div className="col">
              <label className="form-label">在庫しきい値</label>
              <input
                type="number"
                value={stockAlertThreshold}
                onChange={(e) =>
                  setStockAlertThreshold(e.target.value)
                }
                min="0"
                className="form-control"
                placeholder="例：3"
                disabled={busy || created}
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
                disabled={busy || created}
              />
            </div>
          </div>
        </form>
      )}
    </BaseModal>
  );
}