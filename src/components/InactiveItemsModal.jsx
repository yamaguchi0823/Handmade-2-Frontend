import { useEffect, useState } from "react";
import { fetchInactiveItems, reactiveItem } from "../api";
import BaseModal from "./BaseModal";

export default function InactiveItemsModal ({
    open,
    onClose,
    onReactivated,
}){
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState("");

    const loadInactiveItems = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetchInactiveItems();
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch(e) {
            console.error(e);
            setError("無効化済み作品の取得に失敗しました");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        setProcessingId(null);
        setError("");
        loadInactiveItems();

        // モーダルを開いたときだけ取得
        // eslint-disable-next-line react-hook / exhaustive-deps
    },[open]);

    if (!open) return null;

    const reactivate = async (item) => {
        const confirmed = window.confirm(
            `「${item.name}」を再有効化しますか？`,
        );

        if (!confirmed) return;

        try {
            setProcessingId(item.id);
            setError("");

            await reactiveItem(item.id);

            // モーダル内の一覧から即時削除
            setItems((prev) =>
                prev.filter((currentItem) => currentItem.id !== item.id),
            );

            await onReactivated?.(item);
        } catch (e) {
            console.error(e);
            setError(
                e?.responce?.data?.message ||
                "作品の再有効化に失敗しました",
            );
        } finally {
            setProcessingId(null);
        }
    };

    const busy = loading || processingId !== null;

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title="無効化済み作品"
            size="lg"
            busy={busy}
            footer={
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onClose}
                    disabled={busy}
                >
                    閉じる
                </button>
            }
        >
         <p className="text-secondary mb-3">
            無効化した作品を確認し、必要に応じて再有効化できます。
         </p>

         {error && (
           <div className="alert alert-danger">
            {error}
           </div>
         )}

         <div className="d-flex jsutify-content-end mb-3">
            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={loadInactiveItems}
                disabled={busy}
            >
                {loading ? "読み込み中" : "再読み込み"}
            </button>
         </div>

         {loading ? (
            <div className="d-flex align-items-center justify-content-center gap-2 py-5">
                <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                />
                <span>無効化済みの作品を読み込んでいます</span>
            </div>
         ) : (
            <div className="table-responsive">
                <table className="table align-middle">
                    <caption className="visually-hidden">
                        無効化済み作品の一覧
                    </caption>

                    <thead>
                        <tr>
                            <th scope="col">作品名</th>
                            <th scope="col">説明</th>
                            <th scope="col">操作</th>
                        </tr>
                    </thead>
                        <tbody>
    {items.map((item) => {
        const processing = processingId === item.id;

        return (
        <tr key={item.id}>
            <td className="fw-semibold">{item.name}</td>

            <td className="text-muted">
            {item.description ?? "説明なし"}
            </td>

            <td>
            <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() => reactivate(item)}
                disabled={processingId !== null}
            >
                {processing ? "処理中..." : "再有効化"}
            </button>
            </td>
        </tr>
        );
    })}

    {items.length === 0 && (
        <tr>
        <td
            colSpan={3}
            className="text-center text-muted py-5"
        >
            無効化済みの作品はありません
        </td>
        </tr>
    )}
    </tbody>
                </table>
            </div>
         )}
        </BaseModal>
    );
}