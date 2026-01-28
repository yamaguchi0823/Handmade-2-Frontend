// src/components/VariantTable.jsx
export default function VariantTable({ variants, onDelta, updatingId }) {
  return (
    <table border="1" cellPadding="8">
      <thead>
        <tr>
          <th>ID</th>
          <th>SKU</th>
          <th>在庫</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        {Array.isArray(variants) &&
          variants.map((v) => {
            const busy = updatingId === v.id;

            // 在庫0ならマイナスできない
            const canMinus = v.stock > 0;

            return (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.skuCode}</td>
                <td>{v.stock}</td>
                <td>
                  <button
                    onClick={() => onDelta(v.id, -1)}
                    disabled={busy || !canMinus}
                    title={!canMinus ? "在庫が0のため減らせません" : ""}
                  >
                    -
                  </button>
                  <button onClick={() => onDelta(v.id, +1)} disabled={busy}>
                    +
                  </button>
                  {busy && <span> 更新中...</span>}
                </td>
              </tr>
            );
          })}
        {Array.isArray(variants) && variants.length === 0 && (
          <tr>
            <td colSpan={4} style={{ textAlign: "center" }}>
              該当データがありません
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
