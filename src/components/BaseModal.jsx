import { useEffect } from "react";

export default function BaseModal({
  open,
  title,
  size = "md", // sm | md | lg | xl
  busy = false, // saving/loading中の閉じ防止に使える
  closeOnOverlay = true,
  closeOnEsc = true,
  onClose,
  headerRight, // 右上にボタンを差し込む用（任意）
  footer, // footer領域を差し込む用（任意）
  children,
}) {
  // 背景スクロール防止
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  // ESCで閉じる
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !busy) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEsc, busy, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "sm"
      ? "app-modal-sm"
      : size === "lg"
        ? "app-modal-lg"
        : size === "xl"
          ? "app-modal-xl"
          : "app-modal-md";

  return (
    <div
      className="app-modal-overlay"
      onClick={() => {
        if (closeOnOverlay && !busy) onClose?.();
      }}
    >
      <div
        className={`app-modal-box ${sizeClass} p-3 rounded shadow`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal-header">
          <div className="text-truncate app-modal-title">
            <span className="fw-semibold">{title}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {headerRight}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={busy}
              aria-label="close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="app-modal-body">{children}</div>

        {footer && <div className="app-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
