import { useEffect, useState } from "react";
import { fetchStockHistory } from "../api";
import BaseModal from "./BaseModal";

const movementTypeLabels = {
  IN: "入",
  OUT: "出",
  ADJUST: "棚卸",
};

const refTypeLabels = {
  SALE: "販売",
  MANUAL: "在庫",
};

function formatDateTime(value) {
  if (!value) return "-";

  return String(value)
    .slice(0, 19)
    .replace("T", "-")
    .replace(" ", "-");
}

function movementTypeLabel(value) {
  if (!value) return "-";
  return movementTypeLabels[value] ?? value;
}

function refTypeLabel(value) {
  if (!value) return "-";
  return refTypeLabels[value] ?? value;
}

function displayText(value) {
  if (value == null || String(value).trim() === "") {
    return "-";
  }

  return value;
}

export default function StockHistoryModal({
  open,
  onClose,
  variant,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !variant) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetchStockHistory(
          variant.id,
          50,
        );

        setRows(
          Array.isArray(res.data)
            ? res.data
            : [],
        );
      } catch (e) {
        console.error(e);
        setError("履歴の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, variant]);

  if (!open || !variant) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="在庫履歴"
      size="lg"
      busy={loading}
      footer={
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={loading}
        >
          閉じる
        </button>
      }
    >
      <div
        className="mb-3 text-body"
        aria-label="対象バリエーション"
      >
        <div>{displayText(variant.skuCode)}</div>
        <div>{displayText(variant.itemName)}</div>
        <div>{displayText(variant.variantName)}</div>
      </div>

      {error && (
        <div
          className="alert alert-danger py-2"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="d-flex align-items-center gap-2"
          role="status"
        >
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          <span className="text-muted">
            読み込み中...
          </span>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th className="stockhist-th-dt">
                  日時
                </th>
                <th className="stockhist-th-type">
                  種別
                </th>
                <th className="text-end stockhist-th-num">
                  増減
                </th>
                <th className="text-end stockhist-th-num">
                  前
                </th>
                <th className="text-end stockhist-th-num">
                  後
                </th>
                <th>メモ</th>
                <th>参照</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="text-nowrap">
                    {formatDateTime(
                      row.createdAt,
                    )}
                  </td>

                  <td>
                    {movementTypeLabel(
                      row.movementType,
                    )}
                  </td>

                  <td className="text-end">
                    {row.delta ?? 0}
                  </td>

                  <td className="text-end">
                    {row.qtyBefore ?? 0}
                  </td>

                  <td className="text-end">
                    {row.qtyAfter ?? 0}
                  </td>

                  <td>
                    {displayText(row.note)}
                  </td>

                  <td>
                    {refTypeLabel(row.refType)}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-muted py-3"
                  >
                    履歴がありません
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