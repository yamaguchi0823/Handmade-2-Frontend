import { useEffect } from "react";

export default function ImagePreviewModal({ open, imageUrl, title, onClose }) {
  // 背景スクロール停止
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  // ESCで閉じる（便利）
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !imageUrl) return null;

  return (
    <div className="variant-modal-overlay" onClick={onClose}>
      <div
        className="variant-modal-box p-3 rounded shadow bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className={`text-truncate variant-modal-title`}>
            <span className="fw-semibold">{title || "画像プレビュー"}</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <a
              className="btn btn-outline-primary"
              href={imageUrl}
              download
              target="_blank"
              rel="noreferrer"
            >
              ダウンロード
            </a>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* スクロール領域 */}
        <div className="variant-modal-body">
          <div className="d-flex justify-content-center">
            <img
              src={imageUrl}
              alt={title || ""}
              className="variant-preview-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
