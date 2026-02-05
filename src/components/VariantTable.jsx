// src/components/VariantTable.jsx
export default function VariantTable({
  variants,
  onDelta,
  updatingId,
  onEdit,
}) {
  const isArray = Array.isArray(variants);

  const stockBadge = (v) => {
    // v.stock_alert_threshold が来ている前提（来ていなくても壊れない）
    const threshold = Number(v.stockAlertThreshold ?? 0);
    const stock = Number(v.stock ?? 0);

    if (stock === 0) {
      return <span className="badge text-bg-secondary">在庫なし</span>;
    }
    if (threshold > 0 && stock <= threshold) {
      return <span className="badge text-bg-warning">在庫少</span>;
    }
    return <span className="badge text-bg-success">在庫あり</span>;
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: 70 }}>ID</th>
            <th style={{ width: 180 }}>作品名</th>
            <th>SKU</th>
            <th style={{ width: 110 }} className="text-end">
              在庫
            </th>
            <th style={{ width: 110 }} className="text-end">
              しきい値
            </th>
            <th style={{ width: 120 }} className="text-end">
              価格
            </th>
            <th style={{ width: 120 }}>状態</th>
            <th style={{ width: 170 }}>操作</th>
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
                  <td>{v.id}</td>
                  <td
                    className="text-truncate"
                    style={{ maxWidth: 180 }}
                    title={v.itemName ?? ""}
                  >
                    {v.itemName ?? "-"}
                  </td>
                  <td className="text-nowrap">{v.skuCode}</td>
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
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onEdit(v)}
                        disabled={busy}
                      >
                        編集
                      </button>
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
