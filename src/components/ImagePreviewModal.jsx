import BaseModal from "./BaseModal";

export default function ImagePreviewModal({ open, imageUrl, title, onClose }) {
  if (!open || !imageUrl) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title || "画像プレビュー"}
      size="xl"
      headerRight={
        <a
          className="btn btn-outline-primary"
          href={imageUrl}
          download
          target="_blank"
          rel="noreferrer"
        >
          ダウンロード
        </a>
      }
    >
      <div className="d-flex justify-content-center">
        <img
          src={imageUrl}
          alt={title | ""}
          className="app-modal-preview-img"
        />
      </div>
    </BaseModal>
  );
}
