// src/components/ItemCreateModal.jsx
import { useEffect, useId, useState } from "react";
import { createItem } from "../api";
import BaseModal from "./BaseModal";

export default function ItemCreateModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nameHelpId = useId();
  const descriptionHelpId = useId();

  // モーダルを開くたびに入力内容を初期化
  useEffect(() => {
    if (!open) return;

    setName("");
    setDescription("");
    setSaving(false);
    setError("");
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("作品名を入力してください");
      return;
    }

    try {
      setSaving(true);

      await createItem({
        name: trimmedName,
        description: description.trim() || null,
      });

      await onCreated?.();
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "作品の登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="作品を登録"
      size="md"
      busy={saving}
      footer={
        <>
          <button
            type="submit"
            form="item-create-form"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "登録中..." : "登録する"}
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
      <p className="text-secondary mb-3">
        作品の基本情報を登録します。バリエーションは作品登録後に追加できます。
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form id="item-create-form" onSubmit={submit}>
        <div className="mb-3">
          <label htmlFor="item-create-name" className="form-label">
            作品名
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">必須</span>
          </label>

          <input
            id="item-create-name"
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：ポリゴンピアス（単色）"
            maxLength={100}
            required
            aria-describedby={nameHelpId}
            disabled={saving}
            data-modal-initial-focus
          />

          <div id={nameHelpId} className="form-text">
            一覧で作品を判別しやすい名前を入力してください。
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="item-create-description" className="form-label">
            説明
            <span className="text-secondary fw-normal ms-2">任意</span>
          </label>

          <textarea
            id="item-create-description"
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="作品の特徴や管理用のメモを入力"
            rows={4}
            maxLength={500}
            aria-describedby={descriptionHelpId}
            disabled={saving}
          />

          <div id={descriptionHelpId} className="form-text">
            バリエーションごとの情報は、バリエーション登録時に入力します。
          </div>
        </div>
      </form>
    </BaseModal>
  );
}