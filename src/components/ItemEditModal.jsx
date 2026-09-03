import { useEffect, useId, useState } from "react";
import { updateItem } from "../api";
import BaseModal from "./BaseModal";

export default function ItemEditModal({
    open,
    item,
    onClose,
    onUpdated,
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const nameHelpId = useId();
    const descriptionHelpId = useId();

    useEffect(() => {
        if (!open || !item) return;

        setName(item.name ?? "");
        setDescription(item.description ?? "");
        setSaving(false);
        setError("");
    },[open, item]);

    if (!open || !item) return null;

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        const trimedName = name.trim();

        if (!trimedName) {
            setError("作品名を入力してください");
            return;
        }

        try {
            setSaving(true);

            await updateItem(item.id, {
                name: trimedName,
                description: description.trim() || null,
            });

            await onUpdated?.();
            onClose?.();
        } catch (e2) {
            console.error(e2);
            setError(e2?.response?.message || "作品の更新に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title="作品情報を編集"
            size="md"
            busy={saving}
            footer={
                <>
                    <button
                        type="submit"
                        form="item-edit-form"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? "保存中" : "変更を保存"}
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
                作品の基本情報を変更します。バリエーションの情報には影響しません。
            </p>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <form id="item-edit-form" onSubmit={submit}>
                <div className="mb-3">
                    <label htmlFor="item-edit-name" className="form-label">
                        作品名
                    <span className="text-danger ms-1" aria-hidden="true">
                        *
                    </span>
                    <span className="visually-hidden">必須</span>
                    </label>

                    <input
                        id="item-edit-name"
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        required
                        aria-describedby={nameHelpId}
                        disabled={saving}
                        data-modal-initial-focus
                    />
                    <div id={nameHelpId} className="form-text">
                        一覧で作品を判別しやすい名前を入力してください
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="item-edit-description" className="form-label">
                        説明
                        <span className="text-secondary fw-nomal ms-2">任意</span>
                    </label>
                    <textarea
                        id="item-edit-description"
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        maxLength={500}
                        aria-describedby={descriptionHelpId}
                        disabled={saving}
                     />
                        <div id={descriptionHelpId} className="form-text">
                            作品全体に関する特徴や管理用のメモを入力できます。
                        </div>
                </div>
            </form>
        </BaseModal>
    );

}