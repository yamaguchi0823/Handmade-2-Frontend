import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createSale,
  fetchChannels,
} from "../api";

import BaseModal from "./BaseModal";

function todayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function SaleCreateModal({
  open,
  onClose,
  variants,
  onCreated,
}) {
  const [saleDate, setSaleDate] = useState(todayYmd(),);
  const [itemId, setItemId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const list = Array.isArray(variants)
    ? variants
    : [];

  // モーダルを開くたびに入力内容を初期化し、
  // 販売チャネルを取得する
  useEffect(() => {
    if (!open) return;

    setSaleDate(todayYmd());
    setItemId("");
    setVariantId("");
    setQty("1");
    setNote("");
    setChannelId("");
    setError("");

    const loadChannels = async () => {
      try {
        const res = await fetchChannels();

        setChannels(
          Array.isArray(res.data)
            ? res.data
            : [],
        );
      } catch (e) {
        console.error(e);

        // チャネル取得失敗でも販売登録は可能
        setChannels([]);
      }
    };

    loadChannels();
  }, [open]);

  // variantsから重複しない作品一覧を作る
  const itemOptions = useMemo(() => {
    const itemMap = new Map();

    list.forEach((variant) => {
      const id = variant.itemId;

      if (id == null) return;

      const key = String(id);

      if (!itemMap.has(key)) {
        itemMap.set(key, {
          id,
          name:
            variant.itemName?.trim() ||
            "作品名未設定",
        });
      }
    });

    return Array.from(itemMap.values()).sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          "ja",
        ),
    );
  }, [list]);

  // 選択中の作品に属するバリエーションだけを抽出
  const filteredVariants = useMemo(() => {
    if (!itemId) return [];

    return list.filter(
      (variant) =>
        String(variant.itemId) ===
        String(itemId),
    );
  }, [list, itemId]);

  // バリエーション選択肢の表示内容
  const variantOptions = useMemo(() => {
    return filteredVariants.map((variant) => {
      const variantName =
        variant.variantName?.trim() ||
        "バリエーション名未設定";

      const skuText =
        variant.skuCode?.trim()
          ? `SKU：${variant.skuCode}`
          : "SKU未設定";

      const stock = Number(
        variant.stock ?? 0,
      );

      return {
        id: variant.id,
        label:
          `${variantName} / ` +
          `${skuText} / ` +
          `在庫：${stock}`,
        price: Number(
          variant.price ?? 0,
        ),
      };
    });
  }, [filteredVariants]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!saleDate) {
      setError("販売日を入力してください");
      return;
    }

    if (saleDate > todayYmd()) {
      setError("販売日は今日以前の日付を選択してください",);
      return;
    }

    if (!itemId) {
      setError("作品を選択してください");
      return;
    }

    const selectedVariantId =
      Number(variantId);

    const quantity = Number(qty);

    if (
      !selectedVariantId ||
      selectedVariantId <= 0
    ) {
      setError(
        "バリエーションを選択してください",
      );
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "数量は1以上の整数で入力してください",
      );
      return;
    }

    const selectedVariant =
      variantOptions.find(
        (option) =>
          option.id === selectedVariantId,
      );

    const unitPrice = selectedVariant
      ? Number(
          selectedVariant.price ?? 0,
        )
      : 0;

    try {
      setSaving(true);

      const payload = {
        soldAt: `${saleDate}T00:00:00`,
        channelId: channelId
          ? Number(channelId)
          : null,
        note: note.trim() || null,
        lines: [
          {
            variantId: selectedVariantId,
            qty: quantity,
            unitPrice,
          },
        ],
      };

      await createSale(payload);
      await onCreated?.();
      onClose?.();
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 409
          ? "在庫が不足しています"
          : "") ||
        "販売登録に失敗しました";

      setError(message);
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
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "登録中"
              : "登録"}
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
      {error && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {error}
        </div>
      )}

      <form
        id="sale-create-form"
        onSubmit={submit}
      >
        <div className="mb-3">
          <label
            htmlFor="sale-date"
            className="form-label"
          >
            販売日
          </label>

          <input
            id="sale-date"
            type="date"
            className="form-control"
            value={saleDate}
            max={todayYmd()}
            onChange={(e) =>
              setSaleDate(e.target.value)
            }
            disabled={saving}
            required
           />

        </div>
        <div className="mb-3">
          <label
            htmlFor="sale-item"
            className="form-label"
          >
            作品
          </label>

          <select
            id="sale-item"
            className="form-select"
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);

              // 作品変更時はバリエーションを解除
              setVariantId("");
            }}
            disabled={saving}
          >
            <option value="">
              作品を選択してください
            </option>

            {itemOptions.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label
            htmlFor="sale-variant"
            className="form-label"
          >
            バリエーション
          </label>

          <select
            id="sale-variant"
            className="form-select"
            value={variantId}
            onChange={(e) =>
              setVariantId(e.target.value)
            }
            disabled={
              saving ||
              !itemId
            }
          >
            <option value="">
              {itemId
                ? "バリエーションを選択してください"
                : "先に作品を選択してください"}
            </option>

            {variantOptions.map(
              (option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          {itemId &&
            variantOptions.length === 0 && (
              <div className="form-text">
                この作品には選択できる
                バリエーションがありません
              </div>
            )}
        </div>

        <div className="mb-3">
          <label
            htmlFor="sale-channel"
            className="form-label"
          >
            チャネル
          </label>

          <select
            id="sale-channel"
            className="form-select"
            value={channelId}
            onChange={(e) =>
              setChannelId(e.target.value)
            }
            disabled={saving}
          >
            <option value="">
              （未選択）
            </option>

            {channels.map((channel) => (
              <option
                key={channel.id}
                value={channel.id}
              >
                {channel.name}
                （手数料：
                {Number(
                  channel.feeRate ?? 0,
                )}
                % / 固定費：
                {Number(
                  channel.fixedFee ?? 0,
                )}
                ）
              </option>
            ))}
          </select>

          <div className="form-text">
            チャネル別の利益集計に使用します
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-sm-4">
            <label
              htmlFor="sale-quantity"
              className="form-label"
            >
              数量
            </label>

            <input
              id="sale-quantity"
              className="form-control"
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) =>
                setQty(e.target.value)
              }
              disabled={saving}
            />
          </div>

          <div className="col-12 col-sm-8">
            <label
              htmlFor="sale-note"
              className="form-label"
            >
              メモ
            </label>

            <input
              id="sale-note"
              className="form-control"
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              disabled={saving}
              placeholder="例：イベント販売など"
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
