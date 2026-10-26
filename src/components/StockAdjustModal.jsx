import { useEffect, useRef, useState } from "react";
import api, { adjustStock } from "../api";
import BaseModal from "./BaseModal";

// 空欄や小数、負の数を除き、0以上の整数だけを受け付ける
function parseStock(value) {
  if (String(value).trim() === "") return null;

  const number = Number(value);

  return Number.isSafeInteger(number) && number >= 0
    ? number
    : null;
}

export default function StockAdjustModal({
  readOnly = true,
  open,
  variant,
  onClose,
  onAdjusted,
}) {
  const [mode, setMode] = useState("delta");
  const [increase, setIncrease] = useState("0");
  const [decrease, setDecrease] = useState("0");
  const [newStock, setNewStock] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 素早い連続操作による二重送信を防ぐ
  const submittingRef = useRef(false);

  const variantId = variant?.id;
  const currentStock = Number(variant?.stock ?? 0);

  // 開いたときに初期化
  useEffect(() => {
    if (!open || variantId == null) return;

    setMode("delta");
    setIncrease("0");
    setDecrease("0");
    setNewStock("");
    setNote("");
    setError("");
    setSaving(false);
    submittingRef.current = false;
  }, [open, variantId]);

  if (!open || !variant) return null;

  const increaseNumber = parseStock(increase);
  const decreaseNumber = parseStock(decrease);
  const countedStock = parseStock(newStock);

  let previewStock = null;
  let validationMessage = "";

  if (mode === "delta") {
    if (increaseNumber === null || decreaseNumber === null) {
      validationMessage = "数量は0以上の整数で入力してください。";
    } else if (increaseNumber > 0 && decreaseNumber > 0) {
      validationMessage = "増やす数・減らす数は、片方だけ入力してください。";
    } else {
      const result = currentStock + increaseNumber - decreaseNumber;

      if (!Number.isSafeInteger(result)) {
        validationMessage = "数量が大きすぎます。";
      } else if (result < 0) {
        validationMessage = "現在の在庫数を超えて減らすことはできません。";
      } else {
        previewStock = result;
      }
    }
  } else if (countedStock !== null) {
    previewStock = countedStock;
  } else if (newStock !== "") {
    validationMessage = "棚卸し結果数は0以上の整数で入力してください。";
  }

  const difference =
    previewStock === null ? null : previewStock - currentStock;

  const canSubmit =
    !readOnly &&
    !saving &&
    !validationMessage &&
    difference !== null &&
    difference !== 0;

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setIncrease("0");
    setDecrease("0");
    setNewStock("");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (readOnly || submittingRef.current || !canSubmit) return;

    submittingRef.current = true;
    setSaving(true);
    setError("");

    let savedStock = previewStock;

    try {
      const trimmedNote = note.trim();

      if (mode === "delta") {
        const res = await api.post(
          `/variants/${variant.id}/stock-movements/delta`,
          {
            delta: difference,
            note:
              trimmedNote ||
              (difference > 0 ? "在庫追加" : "在庫減少"),
          },
        );

        // サーバーが返した在庫数を優先する
        if (Number.isSafeInteger(res.data?.stock)) {
          savedStock = res.data.stock;
        }
      } else {
        await adjustStock(variant.id, {
          newStock: previewStock,
          note: trimmedNote || "棚卸",
        });
      }
    } catch (e2) {
      console.error(e2);

      setError(
        e2?.response?.data?.message ||
          (e2?.response?.status === 409
            ? "在庫状況が変わった可能性があります。一度閉じて一覧を更新してください。"
            : "在庫の更新に失敗しました。"),
      );

      submittingRef.current = false;
      setSaving(false);
      return;
    }

    // 保存成功後に一覧側へ通知
    try {
      await onAdjusted?.(savedStock);
      onClose?.();
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="在庫調整"
      size="md"
      busy={saving}
      closeOnOverlay={false}
      footer={
        <>
          <button
            type="submit"
            form="stock-adjust-form"
            className="btn btn-primary"
            disabled={!canSubmit}
          >
            {saving ? "保存中…" : "確定"}
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
      <p className="text-muted mb-4">
        制作・廃棄などによる増減、棚卸しによる調整を行います。
      </p>

      <div className="mb-4">
        <div className="mb-1 text-break">
          SKU：{variant.skuCode || "未設定"}
        </div>

        <div className="mb-1 text-break">
          作品：{variant.itemName}
        </div>

        <div className="text-break">
          バリエーション：{variant.variantName || "名称未設定"}
        </div>
      </div>

      <div className="border-bottom pb-3 mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="fw-bold">現在の在庫　：</span>
          <span className="fs-2 fw-bold">{currentStock}</span>
        </div>

        <div
          className="d-flex flex-wrap align-items-center gap-3"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="fw-bold">調整後の在庫：</span>

          <span className="fs-2 fw-bold text-primary">
            {previewStock ?? "—"}
          </span>

          {difference !== null && difference !== 0 && (
            <span className="text-muted">
              （{difference > 0 ? "+" : ""}
              {difference}点）
            </span>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="alert alert-info py-2" role="status">
          閲覧専用デモのため、入力は試せますが保存はできません。
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <form id="stock-adjust-form" onSubmit={submit}>
        <fieldset className="mb-4" disabled={saving}>
          <legend className="visually-hidden">
            在庫調整の方法
          </legend>

          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input
                id="stock-mode-delta"
                type="radio"
                name="stock-adjust-mode"
                className="form-check-input"
                checked={mode === "delta"}
                onChange={() => changeMode("delta")}
              />
              <label
                htmlFor="stock-mode-delta"
                className="form-check-label"
              >
                在庫の増減
              </label>
            </div>

            <div className="form-check">
              <input
                id="stock-mode-adjust"
                type="radio"
                name="stock-adjust-mode"
                className="form-check-input"
                checked={mode === "adjust"}
                onChange={() => changeMode("adjust")}
              />
              <label
                htmlFor="stock-mode-adjust"
                className="form-check-label"
              >
                棚卸しによる調整
              </label>
            </div>
          </div>
        </fieldset>

        {mode === "delta" ? (
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label
                htmlFor="stock-increase"
                className="form-label fw-bold"
              >
                増やす
              </label>
              <input
                id="stock-increase"
                type="number"
                min="0"
                step="1"
                required
                className="form-control"
                value={increase}
                onChange={(e) => {
                  const value = e.target.value;
                  setIncrease(value);
                  if (Number(value) > 0) setDecrease("0");
                  setError("");
                }}
                disabled={saving}
              />
            </div>

            <div className="col-6">
              <label
                htmlFor="stock-decrease"
                className="form-label fw-bold"
              >
                減らす
              </label>
              <input
                id="stock-decrease"
                type="number"
                min="0"
                step="1"
                required
                className="form-control"
                value={decrease}
                onChange={(e) => {
                  const value = e.target.value;
                  setDecrease(value);
                  if (Number(value) > 0) setIncrease("0");
                  setError("");
                }}
                disabled={saving}
              />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <label
              htmlFor="stock-counted"
              className="form-label fw-bold"
            >
              棚卸し結果数
            </label>

            <input
              id="stock-counted"
              type="number"
              min="0"
              step="1"
              required
              className="form-control"
              value={newStock}
              onChange={(e) => {
                setNewStock(e.target.value);
                setError("");
              }}
              placeholder="実際に数えた在庫数"
              disabled={saving}
            />

            <div className="form-text">
              実際の在庫数に合わせます。0点も入力できます。
            </div>
          </div>
        )}

        {validationMessage && (
          <p className="text-danger mb-3" role="alert">
            {validationMessage}
          </p>
        )}

        <div className="mb-3">
          <label
            htmlFor="stock-adjust-note"
            className="form-label fw-bold"
          >
            メモ（任意）
          </label>

          <input
            id="stock-adjust-note"
            type="text"
            className="form-control"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="増減・棚卸しの理由など"
            disabled={saving}
          />
        </div>

        <p className="small text-muted mb-0">
          「確定」を押すまで、実際の在庫数は変更されません。
        </p>
      </form>
    </BaseModal>
  );
}