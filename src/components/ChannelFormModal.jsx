import {
    useEffect,
    useId,
    useState,
} from "react";

import {
    createChannel,
    updateChannel,
} from "../api";

import BaseModal from "./BaseModal";

export default function ChannelFormModal({
    readOnly = true,
    open,
    channel = null,
    onClose,
    onSaved,
}) {
    const nameId = useId();
    const feeRateId = useId();
    const fixedFeeId = useId();
    const noteId = useId();
    const formId = useId();

    const [name, setName] = useState("");
    const [feeRate, setFeeRate] = useState("0");
    const [fixedFee, setFixedFee] = useState("0");
    const [note, setNote] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const editing = channel != null;

    useEffect(() => {
        if (!open) return;

        setName(channel?.name ?? "");
        setFeeRate(String(channel?.feeRate ?? 0));
        setFixedFee(String(channel?.fixedFee ?? 0));
        setNote(channel?.note ?? "");

        setSaving(false);
        setError("");

    },[open, channel]);

    const handleClose = () => {
        if (saving) return;
        onClose?.();
    };

    const submit = async (event) => {
        event.preventDefault();

        if (readOnly || saving) return;

        setError("");

        const trimmedName = name.trim();
        const presedFeeRate = Number(feeRate);
        const presedFixedFee = Number(fixedFee);

        if (!trimmedName) {
            setError("チャネル名は必須です");
            return;
        }

        if (trimmedName.length > 100) {
            setError("チャネルは100文字以内で入力してください");
            return;
        }

        if (
            feeRate === "" ||
            !Number.isFinite(presedFeeRate) ||
            presedFeeRate < 0 ||
            presedFeeRate > 100
        ) {
            setError("手数料率は0以上100以下で入力してください");
            return;
        }

        if (
            fixedFee === "" ||
            !Number.isFinite(presedFixedFee) ||
            presedFixedFee < 0
        ) {
            setError("固定費は0以上で入力してください");
            return;
        }

        const payload = {
            name: trimmedName,
            feeRate: presedFeeRate,
            fixedFee: presedFixedFee,
            note: note.trim() || null,
        };

        try {
            setSaving(true);

            if (editing) {
                await updateChannel(channel.id, payload);
            } else {
                await createChannel(payload);
            }

            await onSaved?.(
                editing
                    ? "チャネル情報を更新しました"
                    : "チャネルを登録しました",
            );

            onClose?.();
        } catch (err) {
            console.error(err);

            const responseMessage = err?.response?.data?.message;

            if (err?.response?.status === 409) {
                setError("同じ名前のチャネルが既に登録されています");
            } else {
                setError(
                    responseMessage ||
                        (editing
                            ? "チャネル情報の更新に失敗しました"
                            : "チャネルの登録に失敗しました"
                        ),
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            open={open}
            onClose={handleClose}
            title={
                editing
                    ? "チャネル編集"
                    : "チャネル登録"
            }
            size="sm"
            busy={saving}
            footer={
                <>
                <button
                    type="submit"
                    form={formId}
                    className="btn btn-primary"
                    disabled={readOnly || saving}
                >
                    {saving
                        ? editing
                            ? "更新中..."
                            : "登録中..."
                        : editing
                            ? "更新"
                            : "登録"
                    }
                </button>

                <button
                 type="button"
                 className="btn btn-outline-secondary"
                 onClick={handleClose}
                 disabled={saving}
                >
                    キャンセル
                </button>
                </>
            }
        >
            {readOnly && (
                <div className="alert alert-info py-2" role="status">
                    閲覧専用デモのため、登録・更新はできません。
                </div>
            )}
            {error && (
                <div
                    className="alert alert-danger"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <form
                id={formId}
                onSubmit={submit}
            >
                <div className="mb-3">
                    <label
                        htmlFor={nameId}
                        className="form-label"
                    >
                        チャネル名
                    </label>

                    <input
                        id={nameId}
                        type="text"
                        className="form-control"
                        value={name}
                        maxLength={100}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        disabled={saving}
                        autoComplete="off"
                        data-modal-initial-focus
                     />

                     <div className="form-text">
                        例：minne、creema、委託先など
                     </div>
                </div>

                <div className="mb-3">
                    <label
                        htmlFor={feeRateId}
                        className="form-label"
                    >
                        手数料率
                    </label>

                    <input
                        id={feeRateId}
                        type="number"
                        className="form-control"
                        value={feeRate}
                        min="0"
                        max="100"
                        step="0.01"
                        inputMode="decimal"
                        onChange={(event) =>
                            setFeeRate(event.target.value)}
                        disabled={saving}
                     />

                     <div className="form-text">
                        売上に対して差し引かれる割合を入力します
                     </div>
                </div>

                <div className="mb-3">
                    <label
                        htmlFor={fixedFeeId}
                        className="form-label"
                    >
                        固定費（円）
                    </label>

                    <input
                        id={fixedFeeId}
                        type="number"
                        className="form-control"
                        value={fixedFee}
                        min="0"
                        max="9999999999.99"
                        step="1"
                        inputMode="decimal"
                        onChange={(event) =>
                            setFixedFee(event.target.value)
                        }
                        disabled={saving}
                     />

                     <div className="form-text">
                        販売1件ごとに差し引かれる金額を入力します
                     </div>
                </div>

                <div>
                    <label
                        htmlFor={noteId}
                        className="form-label"
                    >
                        メモ
                        <span>（任意）</span>
                    </label>

                    <textarea
                        id={noteId}
                        className="form-control"
                        value={note}
                        rows={4}
                        onChange={(event) =>
                            setNote(event.target.value)
                        }
                        disabled={saving}
                        placeholder="チャネルに関する補足情報"
                    />
                </div>
            </form>
        </BaseModal>
    );
}