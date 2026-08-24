// src/components/VariantTable.jsx
import styles from "./VariantTable.module.css";

export default function VariantTable({
  variants,
  onDelta,
  updatingId,
  onEdit,
  onAdjust,
  onHistory,
  onPreviewImage,
  mode = "inventory"
}) {
  const isArray = Array.isArray(variants);
  const isInventoryMode = mode === "inventory";
  const isManagementMode = mode === "management";

  const stockBadge = (v) => {
    const threshold = Number(v.stockAlertThreshold ?? 0);
    const stock = Number(v.stock ?? 0);

    if (stock === 0)
      return <span className="badge text-bg-secondary">在庫なし</span>;
    if (threshold > 0 && stock <= threshold)
      return <span className="badge text-bg-warning">在庫少</span>;
    return <span className="badge text-bg-success">在庫あり</span>;
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            {/* <th className={styles.thId}>ID</th> */}
            <th className={styles.thName}>作品名</th>
            <th>SKU</th>
            <th className={`text-end ${styles.thStock}`}>在庫</th>
            <th className={`text-end ${styles.thThreshold}`}>しきい値</th>
            <th className={`text-end ${styles.thPrice}`}>価格</th>
            <th className={styles.thStatus}>状態</th>
            <th className={styles.thActions}>操作</th>
          </tr>
        </thead>

        <tbody>
          {isArray &&
            variants.map((v) => {
              const busy = updatingId === v.id;
              const stock = Number(v.stock ?? 0);
              const threshold = Number(v.stockAlertThreshold ?? 0);

              const isOut = stock === 0;
              const isLow = threshold > 0 && stock > 0 && stock <= threshold;
              const rowClass = isOut
                ? "table-secondary"
                : isLow
                  ? "table-warning"
                  : "";
              const canMinus = stock > 0;

              return (
                <tr key={v.id} className={rowClass}>
                  {/* <td>{v.id}</td> */}

                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {v.imageUrl ? (
                        <img
                          src={v.imageUrl}
                          alt=""
                          onClick={() => onPreviewImage?.(v)}
                          className="u-thumb-36"
                          title="クリックで拡大"
                        />
                      ) : (
                        <div className="u-thumb-placeholder-36" />
                      )}

                      <span
                        className="u-truncate u-maxw-140"
                        title={v.itemName ?? ""}
                      >
                        {v.itemName ?? "-"}
                      </span>
                    </div>
                  </td>

                  <td className="text-nowrap">{v.skuCode || "-"}</td>
                  <td className="text-end">
                    <span className="fw-semibold">{v.stock}</span>
                  </td>
                  <td className="text-end">{v.stockAlertThreshold ?? 0}</td>
                  <td className="text-end">
                    {v.price != null ? Number(v.price).toLocaleString() : "-"}
                  </td>

                  <td>
                    <div className="d-flex flex-column gap-1">
                      {stockBadge(v)}
                      <span className="badge text-bg-light border">
                        {v.status ?? "-"}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {isInventoryMode && (<>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelta(v.id, -1)}
                        disabled={busy || !canMinus}
                        title={!canMinus ? "在庫が0のため減らせません" : ""}
                        >
                        -
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onDelta(v.id, +1)}
                        disabled={busy}
                        >
                        +
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => onAdjust(v)}
                        disabled={busy}
                        >
                        棚卸
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={() => onHistory(v)}
                        disabled={busy}
                        >
                        履歴
                      </button>
                        </>
                      )}

                      {isManagementMode && (
                        <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onEdit(v)}
                        disabled={busy}
                        >
                        編集
                      </button>
                      )}

                      {busy && (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        />
                      )}
                      {busy && (
                        <span className="visually-hidden">更新中...</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

          {isArray && variants.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-muted py-4">
                該当データがありません
              </td>
            </tr>
          )}

          {!isArray && (
            <tr>
              <td colSpan={8} className="text-center text-muted py-4">
                データ形式が不正です
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
