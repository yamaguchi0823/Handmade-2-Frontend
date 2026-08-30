import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export default function BaseModal({
  open,
  title,
  size = "md",
  busy = false,
  closeOnOverlay = true,
  closeOnEsc = true,
  onClose,
  headerRight,
  footer,
  children,
}) {
  const modalRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  // 初期フォーカス・背景操作の停止・フォーカス復帰
  useEffect(() => {
    if (!open) return;

    const appRoot = document.getElementById("root");

    // モーダルを開いた要素を記録
    openerRef.current = document.activeElement;

    document.body.classList.add("modal-open");
    appRoot?.setAttribute("inert", "");

    const animationFrameId = requestAnimationFrame(() => {
      const modal = modalRef.current;
      if (!modal) return;

      const initialFocus =
        modal.querySelector("[data-modal-initial-focus]") ??
        modal.querySelector(
          [
            ".app-modal-body input:not([disabled])",
            ".app-modal-body select:not([disabled])",
            ".app-modal-body textarea:not([disabled])",
            ".app-modal-body button:not([disabled])",
            ".app-modal-footer button:not([disabled])",
            ".app-modal-header button:not([disabled])",
          ].join(","),
        );

      if (initialFocus instanceof HTMLElement) {
        initialFocus.focus();
      } else {
        modal.focus();
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId);

      document.body.classList.remove("modal-open");
      appRoot?.removeAttribute("inert");

      // 開いたボタンへフォーカスを戻す
      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus();
      }
    };
  }, [open]);

  // EscキーとTabキーの制御
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (closeOnEsc && !busy) {
          e.preventDefault();
          onClose?.();
        }

        return;
      }

      if (e.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll(
          [
            "a[href]",
            "button:not([disabled])",
            'input:not([disabled]):not([type="hidden"])',
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(","),
        ),
      ).filter(
        (element) =>
          element instanceof HTMLElement &&
          element.getClientRects().length > 0,
      );

      if (focusableElements.length === 0) {
        e.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const focusIsInsideModal = modal.contains(activeElement);

      // 最初からShift＋Tabを押した場合は最後へ
      if (
        e.shiftKey &&
        (activeElement === firstElement || !focusIsInsideModal)
      ) {
        e.preventDefault();
        lastElement.focus();
        return;
      }

      // 最後からTabを押した場合は最初へ
      if (
        !e.shiftKey &&
        (activeElement === lastElement || !focusIsInsideModal)
      ) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
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

  const modal = (
    <div
      className="app-modal-overlay"
      onClick={() => {
        if (closeOnOverlay && !busy) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`app-modal-box ${sizeClass} p-3 rounded shadow`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal-header">
          <h2
            id={titleId}
            className="h5 mb-0 text-truncate app-modal-title"
          >
            {title}
          </h2>

          <div className="d-flex align-items-center gap-2">
            {headerRight}

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={busy}
              aria-label="モーダルを閉じる"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <div className="app-modal-body">{children}</div>

        {footer && <div className="app-modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}