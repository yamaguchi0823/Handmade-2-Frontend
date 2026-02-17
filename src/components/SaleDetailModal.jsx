import { useEffect } from "react";

export default function SaleDetailModal({ open, sale, onClose }) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  if (!open || !sale) return null;

  const lines = Array.isArray(sale.lines) ? sale.lines : [];

  return (
    <div className="variant-modal-overlay" onClick={onClose}>
      <div
        className="variant-modal-box p-3 rounded shadow bg-white"
        style={{ width: "min(900px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="h5 mb-0">販売詳細 #{sale.id}</h3>
        <button className="btn btn-outline-secondary" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="mb-2 text-muted">
        <div>
          販売日時：{sale.soldAt ? String(sale.soldAt).replace("T", " ") : "-"}
        </div>
        <div>メモ：{sale.note ?? ""}</div>
      </div>

      <div className="variant-modal-body">
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 80 }}>variant</th>
                <th>作品</th>
                <th style={{ width: 140 }}>SKU</th>
                <th style={{ width: 100 }} className="text-den">
                  数量
                </th>
                <th style={{ width: 120 }} className="text-den">
                  単価
                </th>
                <th style={{ width: 140 }} className="text-den">
                  小計
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.variantId}</td>
                  <td>{l.itemName ?? "-"}</td>
                  <td className="text-nowrap">{l.skuCode ?? "-"}</td>
                  <td className="text-end">{l.qty}</td>
                  <td className="text-end">
                    {l.unitPrice != null
                      ? Number(l.unitPrice).toLocaleString()
                      : "-"}
                  </td>
                  <td className="text-end">
                    {l.lineAmount != null
                      ? Number(l.lineAmount).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    明細がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-end fw-semibold">
          合計：{" "}
          {lines
            .reduce((sum, l) => sum + Number(l.lineAmount ?? 0), 0)
            .toLocalString()}
        </div>
      </div>
    </div>
  );
}
