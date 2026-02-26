import BaseModal from "./BaseModal";

function money(n) {
  return Number(n ?? 0).toLocaleString();
}

export default function SaleDetailModal({ open, sale, onClose }) {
  if (!open || !sale) return null;

  const lines = Array.isArray(sale.lines) ? sale.lines : [];
  const total = lines.reduce((sum, l) => sum + (Number(l.lineAmount) || 0), 0);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`販売詳細 #${sale.id}`}
      size="lg"
    >
      <div className="mb-2 text-muted">
        <div>
          販売日時：
          {sale.soldAt ? String(sale.soldAt).replace("T", " ") : "-"}
        </div>
        <div>メモ：{sale.note ?? ""}</div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th className="th80">ID</th>
              <th>作品</th>
              <th className="th120">SKU</th>
              <th className="text-end th80">数量</th>
              <th className="text-end th120">単価</th>
              <th className="text-end th120">小計</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td>{l.variantId}</td>
                <td>
                  {l.itemName ?? "-"}
                  <br />
                  {l.name}
                </td>
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

      <div className="text-end fw-semibold">合計：{total.toLocaleString()}</div>
    </BaseModal>
  );
}
