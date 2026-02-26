import { useEffect, useMemo, useState } from "react";
import { createSale, fetchChannels } from "../api";
import BaseModal from "./BaseModal";

export default function SaleCreateModal({
  open,
  onClose,
  variants,
  onCreated,
}) {
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const list = Array.isArray(variants) ? variants : [];

  // 開いたときにchannels一覧を取得（初期化）
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        const res = await fetchChannels();
        setChannels(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        // チャネル取得失敗でも販売登録はできるようにする（だからエラーにはしない）
        setChannels([]);
      }
    };

    load();
  }, [open]);

  // プルダウン用：表示テスト
  const options = useMemo(() => {
    return list.map((v) => ({
      id: v.id,
      label: `${v.id} ${v.itemName ?? ""} / ${v.skuCode ?? ""}(在庫：${v.stock ?? 0})`,
      price: v.price ?? 0,
    }));
  }, [list]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const vid = Number(variantId);
    const q = Number(qty);

    if (!vid || vid <= 0) {
      setError("バリエーションを選択してください");
      return;
    }
    if (!Number.isInteger(q) || q === 0) {
      setError("数量は０以外の整数で入力してください（返品はマイナス）");
      return;
    }

    const selected = options.find((o) => o.id === vid);
    const unitPrice = selected ? Number(selected.price ?? 0) : 0;

    try {
      setSaving(true);

      const payload = {
        channelId: channelId ? Number(channelId) : null,
        note: note?.trim() || null,
        lines: [{ variantId: vid, qty: q, unitPrice }],
      };

      await createSale(payload);

      onCreated?.(); // 親で在庫一覧更新＆トースト
      onClose?.();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 409 ? "在庫が不足しています" : "") ||
        "販売登録に失敗しました";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="販売登録"
      size="md"
      busy={saving}
      footer={
        <>
          <button
            type="submit"
            form="sale-create-form"
            onSubmit={submit}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "登録中" : "登録"}
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
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">バリエーション</label>
          <select
            className="form-select"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            disabled={saving}
          >
            <option value="">選択してください</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">チャネル</label>
          <select
            className="form-select"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            disabled={saving}
          >
            <option value="">（未選択）</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                （手数料：{Number(c.feeRate ?? 0)}% / 固定費：
                {Number(c.fixedFee ?? 0)}）
              </option>
            ))}
          </select>
          <div className="form-text">
            あとでチャネル別利益を出すために使います
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label">数量</label>
            <input
              className="form-control"
              type="number"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="col-6">
            <label className="form-label">メモ</label>
            <input
              className="form-control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving}
              placeholder="例：イベント/返品など"
            />
          </div>
          <div className="form-text">
            返品は「数量をマイナス」で入力できます（例：-1）
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
