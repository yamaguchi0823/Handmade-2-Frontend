import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { updateVariant, uploadVariantImage, deleteVariantImage } from "../api";

export default function VariantEditModal({
  open,
  onClose,
  variant,
  onUpdated,
  onImageUploaded,
  onPreviewImage,
}) {
  const [variantName, setVariantName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("0");
  const [price, setPrice] = useState("0");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 開いたときに初期値リセット
  useEffect(() => {
    if (!open || !variant) return;

    setVariantName(variant.variantName ?? "");
    setSkuCode(variant.skuCode ?? "");
    setStatus(variant.status ?? "ACTIVE");
    setStockAlertThreshold(String(variant.stockAlertThreshold ?? 0));
    setPrice(String(variant.price ?? 0));
    setError("");
    setImageFile(null);
    setUploading(false);
    setSaving(false);
  }, [open, variant]);

  if (!open || !variant) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!variantName.trim()) {
      setError("バリエーション名は必須です");
      return;
    }

    try {
      setSaving(true);

      await updateVariant(variant.id, {
        variantName: variantName.trim(),
        skuCode: skuCode.trim() || null,
        status,
        stockAlertThreshold: Number(stockAlertThreshold || 0),
        price: Number(price || 0),
      });

      onUpdated?.();
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploading;

  const uploadImage = async () => {
    if (!imageFile) return;

    try {
      setUploading(true);
      setError("");

      const res = await uploadVariantImage(variant.id, imageFile);
      const imageUrl = res.data?.imageUrl;

      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        onImageUploaded?.(variant.id, imageUrl);
      }

      setImageFile(null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "画像アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async () => {
    const ok = window.confirm("画像を削除しますか？");
    if (!ok) return;

    try {
      setUploading(true);
      setError("");

      await deleteVariantImage(variant.id);

      // 親に「画像が消えた」ことを通知（即時反映）
      onImageUploaded?.(variant.id, null);
      setImageFile(null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "画像削除に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="バリエーション編集"
      size="md"
      busy={busy}
      footer={
        <>
          <button
            type="submit"
            form="variant-edit-form"
            className="btn btn-primary"
            disabled={busy}
          >
            {saving ? "保存中..." : "保存"}
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
      <div className="mb-2 text-muted">
        <div>作品：{variant.itemName}</div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form id="variant-edit-form" onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">バリエーション名</label>
          <input
            type="text"
            className="form-control"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="例：モルフォ蝶・サイズ-S"
            disabled={busy}
            />
            <div className="formp-text">
              色・形・タイプなど、バリエーションを識別できる名前
            </div>
        </div>
        <div className="mb-3">
          <label className="form-label">
            SKU<span className="text-muted">（任意）</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={skuCode}
            onChange={(e)=> setSkuCode(e.target.value)}
            placeholder="例：EARRING-RED-S"
            disabled={busy}
            />
            <div className="form-text">
              未入力の場合はSKU無しで登録されます
            </div>
        </div>

        <div className="mb-3">
          <label className="form-label">画像</label>

          {variant.imageUrl && (
            <div className="mb-2">
              <img
                src={variant.imageUrl}
                alt=""
                onClick={() => onPreviewImage?.(variant)}
                title="クリックで拡大"
                className="app-thumb-120"
              />
            </div>
          )}

          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />

          <div className="form-text">
            画像を選んで「画像アップロード」を押してください
          </div>

          <div className="d-flex gap-2 flex-wrap mt-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={!imageFile || busy}
              onClick={uploadImage}
            >
              {uploading ? "アップロード中..." : "画像アップロード"}
            </button>

            {variant.imageUrl && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                disabled={busy}
                onClick={deleteImage}
              >
                画像を削除
              </button>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">ステータス</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
